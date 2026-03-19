"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import type { ContestPhoto, VoteType } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────

async function verifyToken(idToken: string) {
  return adminAuth().verifyIdToken(idToken);
}

// ── Get contest photos, excluding already-voted and own photos ────────────

export async function getContestPhotos(
  idToken: string,
  contestId: string,
): Promise<{ photos: ContestPhoto[] }> {
  const db = adminDb();
  const decoded = await verifyToken(idToken);
  const uid = decoded.uid;

  const votedSnap = await db
    .collection("contest_votes")
    .where("contestId", "==", contestId)
    .where("voterId", "==", uid)
    .get();
  const votedIds = new Set(votedSnap.docs.map((d) => d.data().photoId as string));

  const photosSnap = await db
    .collection("contest_photos")
    .where("contestId", "==", contestId)
    .where("status", "==", "approved")
    .orderBy("uploadedAt", "desc")
    .limit(50)
    .get();

  const photos = photosSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ContestPhoto))
    .filter((p) => p.userId !== uid && !votedIds.has(p.id));

  return { photos };
}

// ── Submit a vote ─────────────────────────────────────────────────────────

export async function submitVote(
  idToken: string,
  photoId: string,
  contestId: string,
  vote: VoteType,
): Promise<{ success: boolean }> {
  const db = adminDb();
  const decoded = await verifyToken(idToken);
  const uid = decoded.uid;

  // Idempotency
  const existing = await db
    .collection("contest_votes")
    .where("voterId", "==", uid)
    .where("photoId", "==", photoId)
    .limit(1)
    .get();
  if (!existing.empty) return { success: false };

  const photoRef  = db.collection("contest_photos").doc(photoId);
  const photoSnap = await photoRef.get();
  if (!photoSnap.exists) return { success: false };
  const photo = photoSnap.data() as ContestPhoto;

  const batch = db.batch();

  // Record vote
  batch.set(db.collection("contest_votes").doc(), {
    voterId: uid,
    photoId,
    contestId,
    vote,
    createdAt: new Date().toISOString(),
  });

  // Increment photo counters
  if (vote === "like") {
    batch.update(photoRef, { likes: FieldValue.increment(1) });
  } else if (vote === "superlike") {
    batch.update(photoRef, { superLikes: FieldValue.increment(1) });
  }

  // Update leaderboard for photo owner (skip = no points)
  if (vote !== "skip") {
    const points = vote === "superlike" ? 3 : 1;
    const lbRef  = db.collection("contest_leaderboard").doc(`${contestId}_${photo.userId}`);
    batch.set(
      lbRef,
      {
        contestId,
        userId:      photo.userId,
        displayName: photo.displayName,
        votePoints:  FieldValue.increment(points),
        updatedAt:   new Date().toISOString(),
      },
      { merge: true },
    );
  }

  await batch.commit();
  return { success: true };
}

// ── Save photo metadata after client-side Storage upload ─────────────────

export async function saveContestPhoto(
  idToken: string,
  contestId: string,
  imageUrl: string,
  caption: string,
  city: string,
): Promise<{ id: string }> {
  const db = adminDb();
  const decoded = await verifyToken(idToken);

  const userSnap    = await db.collection("users").doc(decoded.uid).get();
  const userData    = userSnap.data();
  const displayName = userData?.displayName ?? "Esploratore";

  const ref = db.collection("contest_photos").doc();
  await ref.set({
    userId:         decoded.uid,
    displayName,
    initials:       displayName.slice(0, 2).toUpperCase(),
    avatarGradient: "from-blue-500 to-purple-600",
    imageUrl,
    caption,
    city:           city || null,
    likes:          0,
    superLikes:     0,
    skips:          0,
    contestId,
    status:         "approved",
    uploadedAt:     new Date().toISOString(),
  });

  return { id: ref.id };
}

// ── Get user's own contest photos ─────────────────────────────────────────

export async function getMyPhotos(
  idToken: string,
  contestId: string,
): Promise<{ photos: ContestPhoto[] }> {
  const db = adminDb();
  const decoded = await verifyToken(idToken);

  const snap = await db
    .collection("contest_photos")
    .where("contestId", "==", contestId)
    .where("userId", "==", decoded.uid)
    .get();

  const photos = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ContestPhoto))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return { photos };
}
