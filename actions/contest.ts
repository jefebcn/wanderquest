"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { haversineMetres, isWithinRadius } from "@/lib/geo";
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

  // 5. Atomic write — visit + user points + leaderboard
  const visitRef = db.collection("visits").doc();
  const userRef  = db.collection("users").doc(uid);
  const now      = new Date().toISOString();

  const visit: Omit<Visit, "id"> = {
    userId:       uid,
    landmarkId:   landmark.id,
    landmarkName: landmark.name,
    pointsEarned: landmark.points,
    coordinates:  userCoords,
    verifiedAt:   now,
  };

  await db.runTransaction(async (tx) => {
    tx.set(visitRef, visit);
    tx.set(
      userRef,
      { totalPoints: FieldValue.increment(landmark.points), totalVisits: FieldValue.increment(1) },
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
        { points: FieldValue.increment(landmark.points), visits: FieldValue.increment(1), userId: uid },
        { merge: true }
      );
    }
  });

  return {
    success: true,
    pointsEarned: landmark.points,
    distanceMetres,
    message: `+${landmark.points} punti! Fantastico!`,
    visit: { ...visit, id: visitRef.id } as Visit,
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
