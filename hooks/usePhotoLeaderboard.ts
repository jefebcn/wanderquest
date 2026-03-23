"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import type { ContestPhoto } from "@/types";

export interface PhotoRankEntry {
  rank: number;
  userId: string;
  displayName: string;
  initials: string;
  avatarGradient: string;
  photoURL?: string;
  votePoints: number;
  photoCount: number;
  topPhoto?: string;
  city?: string;
}

const AVATAR_GRADIENTS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-green-500 to-emerald-500",
  "from-red-500 to-rose-500",
  "from-indigo-500 to-blue-500",
  "from-teal-500 to-cyan-500",
  "from-rose-500 to-pink-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/**
 * Real-time photo leaderboard for a contest.
 * Aggregates likes + superLikes per user from Firestore contest_photos.
 * 1 Like = 1 point, 1 SuperLike = 3 points.
 */
export function usePhotoLeaderboard(contestId: string | null, topN = 50) {
  const [entries, setEntries] = useState<PhotoRankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId) {
      setLoading(false);
      return;
    }

    let unsub: Unsubscribe;
    try {
      const { db } = getFirebaseClient();
      const q = query(
        collection(db, "contest_photos"),
        where("contestId", "==", contestId),
        where("status", "in", ["approved", "active", "published"])
      );

      unsub = onSnapshot(q, async (snap) => {
        // Aggregate by userId
        const byUser = new Map<string, {
          displayName: string;
          photoURL?: string;
          votePoints: number;
          photoCount: number;
          topPhoto?: string;
          topPhotoVotes: number;
          city?: string;
          avatarGradient: string;
        }>();

        snap.docs.forEach((d) => {
          const data = d.data() as Omit<ContestPhoto, "id">;
          const pts = (data.likes ?? 0) + (data.superLikes ?? 0) * 3;
          const existing = byUser.get(data.userId);

          if (existing) {
            existing.votePoints  += pts;
            existing.photoCount  += 1;
            if (pts > existing.topPhotoVotes) {
              existing.topPhoto      = data.imageUrl;
              existing.topPhotoVotes = pts;
            }
          } else {
            const gradientIndex =
              data.userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
              AVATAR_GRADIENTS.length;

            byUser.set(data.userId, {
              displayName:    data.displayName ?? "Esploratore",
              votePoints:     pts,
              photoCount:     1,
              topPhoto:       data.imageUrl,
              topPhotoVotes:  pts,
              city:           data.city,
              avatarGradient: AVATAR_GRADIENTS[gradientIndex],
            });
          }
        });

        // Enrich with live user profiles so nicknames/avatars are always current
        const userIds = Array.from(byUser.keys());
        if (userIds.length > 0) {
          try {
            const { db: firestore } = getFirebaseClient();
            const profileDocs = await Promise.all(
              userIds.map((uid) => getDoc(doc(firestore, "users", uid)))
            );
            profileDocs.forEach((profileSnap, i) => {
              const entry = byUser.get(userIds[i]);
              if (!entry || !profileSnap.exists()) return;
              const profile = profileSnap.data();
              if (profile.displayName) entry.displayName = profile.displayName as string;
              if (profile.photoURL)    entry.photoURL    = profile.photoURL as string;
            });
          } catch {
            // non-fatal — fallback to stored names
          }
        }

        // Sort by votePoints descending, assign ranks
        const ranked: PhotoRankEntry[] = Array.from(byUser.entries())
          .sort(([, a], [, b]) => b.votePoints - a.votePoints)
          .slice(0, topN)
          .map(([userId, data], i) => ({
            rank:           i + 1,
            userId,
            displayName:    data.displayName,
            initials:       getInitials(data.displayName),
            avatarGradient: data.avatarGradient,
            photoURL:       data.photoURL,
            votePoints:     data.votePoints,
            photoCount:     data.photoCount,
            topPhoto:       data.topPhoto,
            city:           data.city,
          }));

        setEntries(ranked);
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }

    return () => unsub?.();
  }, [contestId, topN]);

  return { entries, loading };
}
