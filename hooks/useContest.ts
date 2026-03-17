"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import type { Contest } from "@/types";

export function useContest() {
  const [contest, setContest]   = useState<Contest | null>(null);
  const [loading, setLoading]   = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Subscribe to active contest from Firestore
  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const { db } = getFirebaseClient();
      // "active_contest" is a well-known document ID for the current contest
      unsub = onSnapshot(doc(db, "meta", "active_contest"), (snap) => {
        if (!snap.exists()) { setContest(null); setLoading(false); return; }
        const data = snap.data();
        const contestId: string = data?.contestId;
        if (!contestId) { setContest(null); setLoading(false); return; }

        // Subscribe to the actual contest
        return onSnapshot(doc(db, "contests", contestId), (contestSnap) => {
          if (contestSnap.exists()) {
            setContest({ ...(contestSnap.data() as Contest), id: contestSnap.id });
          }
          setLoading(false);
        });
      });
    } catch {
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  // Countdown timer
  const updateTimer = useCallback(() => {
    if (!contest?.endDate) return;
    const diff = new Date(contest.endDate).getTime() - Date.now();
    if (diff <= 0) { setTimeLeft("Terminato"); return; }
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    setTimeLeft(d > 0 ? `${d}g ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
  }, [contest]);

  useEffect(() => {
    updateTimer();
    const id = setInterval(updateTimer, 1_000);
    return () => clearInterval(id);
  }, [updateTimer]);

  return { contest, loading, timeLeft };
}
