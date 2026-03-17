"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { useAuth } from "./useAuth";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  /** ISO date string (YYYY-MM-DD) or undefined */
  lastScanDate?: string;
}

/**
 * Real-time Firestore listener for the current user's streak data.
 * Returns zeros while loading or unauthenticated.
 */
export function useStreak(): StreakData & { loading: boolean } {
  const { user } = useAuth();
  const [data, setData]       = useState<StreakData>({ currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData({ currentStreak: 0, longestStreak: 0 });
      setLoading(false);
      return;
    }

    const { db } = getFirebaseClient();
    const userRef = doc(db, "users", user.uid);

    const unsub = onSnapshot(userRef, (snap) => {
      const d = snap.data() ?? {};
      setData({
        currentStreak: (d.currentStreak as number) ?? 0,
        longestStreak: (d.longestStreak as number) ?? 0,
        lastScanDate:  d.lastScanDate as string | undefined,
      });
      setLoading(false);
    });

    return unsub;
  }, [user]);

  return { ...data, loading };
}
