"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import type { LeaderboardEntry } from "@/types";

/**
 * Real-time leaderboard listener for a given contest.
 * Uses Firestore onSnapshot for live updates.
 */
export function useLeaderboard(contestId: string | null, topN = 50) {
  const [entries, setEntries]   = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) { setLoading(false); return; }

    let unsub: Unsubscribe;
    try {
      const { db } = getFirebaseClient();
      const q = query(
        collection(db, "leaderboard", contestId, "entries"),
        orderBy("points", "desc"),
        limit(topN)
      );

      unsub = onSnapshot(
        q,
        (snap) => {
          const items: LeaderboardEntry[] = snap.docs.map((doc, i) => ({
            rank:         i + 1,
            userId:       doc.id,
            displayName:  doc.data().displayName ?? "Esploratore",
            photoURL:     doc.data().photoURL,
            points:       doc.data().points ?? 0,
            visits:       doc.data().visits ?? 0,
          }));
          setEntries(items);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
      setLoading(false);
    }

    return () => unsub?.();
  }, [contestId, topN]);

  return { entries, loading, error };
}
