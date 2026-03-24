"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth, adminStorage } from "@/lib/firebase/admin";
import { isWithinRadius, haversineMetres } from "@/lib/geo";
import { getCurrentSeasonId, getSeasonStartDate, getSeasonEndDate } from "@/lib/leagues";
import type { Landmark } from "@/types";

export interface SaveLandmarkPhotoPayload {
  landmarkId: string;
  userLat: number;
  userLng: number;
  imageUrl: string;
  storageRef: string;
  caption: string;
  contestId?: string;
}

export interface SaveLandmarkPhotoResult {
  success: boolean;
  pointsEarned: number;
  message: string;
}

async function deleteStorageFile(path: string) {
  try {
    await adminStorage().bucket().file(path).delete();
  } catch {
    // Ignore — file may already be deleted or not exist
  }
}

/**
 * Saves a photo uploaded at a landmark, verifying GPS proximity server-side.
 *
 * Anti-fraud logic:
 * 1. Auth token verified via Firebase Admin.
 * 2. Haversine check: user must be within landmark.radius metres.
 * 3. If outside radius → file deleted from Storage immediately, 0 points awarded.
 * 4. Duplicate check: only one photo per landmark per 24h per user.
 * 5. On success: points awarded + photo saved to both `landmark_photos` and
 *    `contest_photos` (enters the voting feed).
 */
export async function saveLandmarkPhoto(
  idToken: string,
  payload: SaveLandmarkPhotoPayload
): Promise<SaveLandmarkPhotoResult> {
  const db = adminDb();

  // 1. Verify auth token
  let uid: string;
  let displayName: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    const userSnap = await db.collection("users").doc(uid).get();
    displayName = (userSnap.data()?.displayName as string) ?? "Esploratore";
  } catch {
    await deleteStorageFile(payload.storageRef);
    return { success: false, pointsEarned: 0, message: "Non autenticato." };
  }

  // 2. Load landmark
  const landmarkDoc = await db.collection("landmarks").doc(payload.landmarkId).get();
  if (!landmarkDoc.exists) {
    await deleteStorageFile(payload.storageRef);
    return { success: false, pointsEarned: 0, message: "Monumento non trovato." };
  }
  const landmark = { ...(landmarkDoc.data() as Landmark), id: landmarkDoc.id };

  // 3. GPS anti-fraud check
  const userCoords = { lat: payload.userLat, lng: payload.userLng };
  const distanceMetres = haversineMetres(userCoords, landmark.coordinates);

  if (!isWithinRadius(userCoords, landmark.coordinates, landmark.radius)) {
    // Delete the uploaded file immediately — fraud or wrong location
    await deleteStorageFile(payload.storageRef);
    return {
      success: false,
      pointsEarned: 0,
      message: `Posizione non verificata (${Math.round(distanceMetres)}m). Devi essere entro ${landmark.radius}m. Foto eliminata.`,
    };
  }

  // 4. Duplicate check — one photo per landmark per 24h
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  const recentSnap = await db
    .collection("landmark_photos")
    .where("userId", "==", uid)
    .where("landmarkId", "==", payload.landmarkId)
    .where("uploadedAt", ">=", yesterday)
    .limit(1)
    .get();

  if (!recentSnap.empty) {
    await deleteStorageFile(payload.storageRef);
    return {
      success: false,
      pointsEarned: 0,
      message: "Hai già caricato una foto qui nelle ultime 24 ore.",
    };
  }

  // 5. Award points + save records atomically
  const userRef = db.collection("users").doc(uid);
  const landmarkPhotoRef = db.collection("landmark_photos").doc();
  const contestPhotoRef = db.collection("contest_photos").doc();
  const now = new Date().toISOString();
  const todayStr = now.slice(0, 10);

  let pointsEarned = landmark.points;
  let newStreak = 1;
  let bonusPoints = 0;

  await db.runTransaction(async (tx) => {
    const userSnap2 = await tx.get(userRef);
    const userData = userSnap2.data() ?? {};
    const lastScanDate = (userData.lastScanDate as string | undefined) ?? null;
    const currentStreak = (userData.currentStreak as number) ?? 0;
    const longestStreak = (userData.longestStreak as number) ?? 0;
    const multiplier = (userData.pointsMultiplier as number) ?? 1.0;

    // Streak calculation (same logic as validateCheckIn)
    if (!lastScanDate) {
      newStreak = 1;
    } else if (lastScanDate === todayStr) {
      newStreak = currentStreak;
    } else {
      const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      newStreak = lastScanDate === yesterdayStr ? currentStreak + 1 : 1;
    }

    if (newStreak === 3) bonusPoints = 50;
    else if (newStreak > 0 && newStreak % 7 === 0) bonusPoints = 150;

    const totalPoints = Math.round((landmark.points + bonusPoints) * multiplier);
    pointsEarned = totalPoints;
    const newLongest = Math.max(longestStreak, newStreak);

    // Season tracking
    const activeSeasonId = getCurrentSeasonId();
    const existingSeasonId = (userData.currentSeasonId as string | undefined) ?? null;
    const isNewSeason = existingSeasonId !== activeSeasonId;

    // Save to landmark_photos collection
    tx.set(landmarkPhotoRef, {
      userId: uid,
      landmarkId: payload.landmarkId,
      landmarkName: landmark.name,
      imageUrl: payload.imageUrl,
      storageRef: payload.storageRef,
      gpsVerified: true,
      lat: payload.userLat,
      lng: payload.userLng,
      distanceMetres,
      pointsEarned: totalPoints,
      uploadedAt: now,
    });

    // Save to contest_photos so it enters the voting feed
    tx.set(contestPhotoRef, {
      userId: uid,
      displayName,
      initials: displayName.slice(0, 2).toUpperCase(),
      avatarGradient: "from-emerald-500 to-teal-600",
      imageUrl: payload.imageUrl,
      caption: payload.caption || landmark.name,
      city: landmark.city || null,
      likes: 0,
      superLikes: 0,
      skips: 0,
      contestId: payload.contestId ?? null,
      landmarkId: payload.landmarkId,
      gpsVerified: true,
      status: "approved",
      uploadedAt: now,
    });

    // Update user profile
    tx.set(
      userRef,
      {
        totalPoints: FieldValue.increment(totalPoints),
        totalVisits: FieldValue.increment(1),
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastScanDate: todayStr,
        currentSeasonId: activeSeasonId,
        seasonPoints: isNewSeason
          ? totalPoints
          : FieldValue.increment(totalPoints),
        leagueId: (userData.leagueId as string | undefined) ?? "bronze",
        // Update season meta inline
        _seasonMeta: {
          startAt: getSeasonStartDate(activeSeasonId),
          endAt: getSeasonEndDate(activeSeasonId),
        },
      },
      { merge: true }
    );

    // Update contest leaderboard
    if (payload.contestId) {
      const entryRef = db
        .collection("leaderboard")
        .doc(payload.contestId)
        .collection("entries")
        .doc(uid);
      tx.set(
        entryRef,
        {
          points: FieldValue.increment(totalPoints),
          visits: FieldValue.increment(1),
          userId: uid,
          displayName,
          ...(userData.photoURL ? { photoURL: userData.photoURL as string } : {}),
        },
        { merge: true }
      );
    }
  });

  const bonusMsg = bonusPoints > 0 ? ` Streak bonus +${bonusPoints}pt!` : "";
  return {
    success: true,
    pointsEarned,
    message: `+${pointsEarned} punti! Foto verificata 📸${bonusMsg}`,
  };
}
