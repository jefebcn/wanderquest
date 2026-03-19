"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { haversineMetres, isWithinRadius } from "@/lib/geo";
import { getCurrentSeasonId, getSeasonStartDate, getSeasonEndDate } from "@/lib/leagues";
import type {
  CheckInPayload,
  CheckInResult,
  Contest,
  Landmark,
  Visit,
} from "@/types";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Validates a check-in server-side:
 * 1. Authenticates the user via their ID token.
 * 2. Loads the landmark.
 * 3. Runs Haversine to verify the user is within the check-in radius.
 * 4. Prevents duplicate check-ins within 24 h.
 * 5. Atomically awards points and records the visit.
 */
export async function validateCheckIn(
  idToken: string,
  payload: CheckInPayload
): Promise<CheckInResult> {
  const db = adminDb();

  // 1. Verify auth token
  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return { success: false, pointsEarned: 0, distanceMetres: 0, message: "Non autenticato." };
  }

  // 2. Load landmark
  const landmarkDoc = await db.collection("landmarks").doc(payload.landmarkId).get();
  if (!landmarkDoc.exists) {
    return { success: false, pointsEarned: 0, distanceMetres: 0, message: "Landmark non trovato." };
  }
  const landmark = { ...(landmarkDoc.data() as Landmark), id: landmarkDoc.id };

  // 3. Haversine check
  const userCoords = { lat: payload.userLat, lng: payload.userLng };
  const distanceMetres = haversineMetres(userCoords, landmark.coordinates);
  if (!isWithinRadius(userCoords, landmark.coordinates, landmark.radius)) {
    return {
      success: false,
      pointsEarned: 0,
      distanceMetres,
      message: `Sei troppo lontano (${Math.round(distanceMetres)} m). Avvicinati entro ${landmark.radius} m.`,
    };
  }

  // 4. Duplicate check — allow one visit per landmark per 24 h
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  const recentSnap = await db
    .collection("visits")
    .where("userId", "==", uid)
    .where("landmarkId", "==", payload.landmarkId)
    .where("verifiedAt", ">=", yesterday)
    .limit(1)
    .get();

  if (!recentSnap.empty) {
    return {
      success: false,
      pointsEarned: 0,
      distanceMetres,
      message: "Hai già visitato questo posto nelle ultime 24 ore.",
    };
  }

  // 5. Atomic write — visit + user points + streak + leaderboard
  const visitRef = db.collection("visits").doc();
  const userRef  = db.collection("users").doc(uid);
  const now      = new Date().toISOString();
  /** ISO date (YYYY-MM-DD) in UTC — used for streak comparisons */
  const todayStr = now.slice(0, 10);

  const visit: Omit<Visit, "id"> = {
    userId:       uid,
    landmarkId:   landmark.id,
    landmarkName: landmark.name,
    pointsEarned: landmark.points,
    coordinates:  userCoords,
    verifiedAt:   now,
  };

  // Streak calculation (run inside the transaction so it's consistent)
  let newStreak  = 1;
  let bonusPoints = 0;

  await db.runTransaction(async (tx) => {
    // ── Read user doc for streak data ────────────────────────────
    const userSnap    = await tx.get(userRef);
    const userData    = userSnap.data() ?? {};
    const lastScanDate  = (userData.lastScanDate as string | undefined) ?? null;
    const currentStreak = (userData.currentStreak as number) ?? 0;
    const longestStreak = (userData.longestStreak as number) ?? 0;

    // ── Compute new streak ───────────────────────────────────────
    if (!lastScanDate) {
      newStreak = 1;
    } else if (lastScanDate === todayStr) {
      // Same calendar day — keep streak, no bonus re-award
      newStreak = currentStreak;
    } else {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      newStreak = lastScanDate === yesterday ? currentStreak + 1 : 1;
    }

    // Milestone bonuses: 3-day → +50 pt, every 7-day multiple → +150 pt
    if (newStreak === 3) bonusPoints = 50;
    else if (newStreak > 0 && newStreak % 7 === 0) bonusPoints = 150;

    // ── Pro multiplier (+25% for Pro users) ──────────────────────
    const multiplier  = (userData.pointsMultiplier as number) ?? 1.0;
    const basePoints  = landmark.points + bonusPoints;
    const totalPoints = Math.round(basePoints * multiplier);
    const newLongest  = Math.max(longestStreak, newStreak);

    // ── Season tracking ──────────────────────────────────────────
    const activeSeasonId = getCurrentSeasonId();
    const existingSeasonId = (userData.currentSeasonId as string | undefined) ?? null;
    // Reset seasonPoints if user is in a different season (e.g. new month just started)
    const seasonPointsDelta = totalPoints;
    const isNewSeason = existingSeasonId !== activeSeasonId;

    // ── Writes ───────────────────────────────────────────────────
    tx.set(visitRef, visit);
    tx.set(
      userRef,
      {
        totalPoints:    FieldValue.increment(totalPoints),
        totalVisits:    FieldValue.increment(1),
        currentStreak:  newStreak,
        longestStreak:  newLongest,
        lastScanDate:   todayStr,
        // Season fields — reset to delta if new season, increment otherwise
        currentSeasonId: activeSeasonId,
        seasonPoints:    isNewSeason
          ? seasonPointsDelta
          : FieldValue.increment(seasonPointsDelta),
        // New users start in bronze
        leagueId: (userData.leagueId as string | undefined) ?? "bronze",
      },
      { merge: true }
    );

    // Update season meta document (create if missing)
    const metaSeasonRef = db.collection("meta").doc("active_season");
    tx.set(
      metaSeasonRef,
      {
        seasonId: activeSeasonId,
        startAt:  getSeasonStartDate(activeSeasonId),
        endAt:    getSeasonEndDate(activeSeasonId),
        status:   "active",
      },
      { merge: true }
    );

    // Update active contest leaderboard if contestId given
    if (payload.contestId) {
      const entryRef = db
        .collection("leaderboard")
        .doc(payload.contestId)
        .collection("entries")
        .doc(uid);
      tx.set(
        entryRef,
        { points: FieldValue.increment(totalPoints), visits: FieldValue.increment(1), userId: uid },
        { merge: true }
      );
    }
  });

  // Re-read multiplier outside tx scope (was captured inside)
  const userDocFinal = await db.collection("users").doc(uid).get();
  const multiplierFinal = (userDocFinal.data()?.pointsMultiplier as number) ?? 1.0;
  const totalPointsEarned = Math.round((landmark.points + bonusPoints) * multiplierFinal);

  const streakMsg = bonusPoints > 0
    ? ` 🔥 Streak ${newStreak}gg! +${bonusPoints} bonus`
    : newStreak > 1 ? ` 🔥 ${newStreak} giorni di fila!` : "";
  const proMsg = multiplierFinal > 1 ? ` ⚡ Pro ×${multiplierFinal}` : "";

  return {
    success:        true,
    pointsEarned:   totalPointsEarned,
    distanceMetres,
    message:        `+${totalPointsEarned} punti! Fantastico!${streakMsg}${proMsg}`,
    visit:          { ...visit, id: visitRef.id } as Visit,
    streakBonus:    bonusPoints,
    currentStreak:  newStreak,
  };
}

/**
 * Creates or renews a monthly contest in Firestore.
 * Sets meta/active_contest to point to the new contest.
 * Should only be called by an admin user.
 */
export async function createOrRenewContest(
  idToken: string,
  options?: {
    title?: string;
    description?: string;
    prizePool?: number;
    topN?: number;
    durationDays?: number;
  }
): Promise<{ success: boolean; contestId?: string; message: string }> {
  const db = adminDb();

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return { success: false, message: "Non autenticato." };
  }

  // Check admin role
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data();
  if (!userData?.isAdmin) {
    return { success: false, message: "Permessi insufficienti." };
  }

  const now = new Date();
  const durationDays = options?.durationDays ?? 30;
  const endDate = new Date(now.getTime() + durationDays * 86_400_000);

  const contestData = {
    title: options?.title ?? `Contest ${now.toLocaleString("it-IT", { month: "long", year: "numeric" })}`,
    description: options?.description ?? "Carica le tue foto di viaggio e vinci premi reali!",
    prizePool: options?.prizePool ?? 35000, // €350 default
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    status: "active" as const,
    minThresholdCents: 1000,
    topN: options?.topN ?? 3,
    createdBy: uid,
    createdAt: now.toISOString(),
  };

  const batch = db.batch();

  // Create contest document
  const contestRef = db.collection("contests").doc();
  batch.set(contestRef, contestData);

  // Update meta/active_contest pointer
  batch.set(db.collection("meta").doc("active_contest"), {
    contestId: contestRef.id,
    updatedAt: now.toISOString(),
  });

  await batch.commit();

  return {
    success: true,
    contestId: contestRef.id,
    message: `Contest creato! Scade il ${endDate.toLocaleDateString("it-IT")}.`,
  };
}

/**
 * Returns the active contest (if any).
 */
export async function getActiveContest(): Promise<Contest | null> {
  const now  = new Date().toISOString();
  const snap = await adminDb()
    .collection("contests")
    .where("status", "==", "active")
    .where("endDate", ">=", now)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...(doc.data() as Contest), id: doc.id };
}
