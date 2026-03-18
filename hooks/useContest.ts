"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, collection, query, where, limit, getDocs } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import type { Contest } from "@/types";

export function useContest() {
  const [contest, setContest]   = useState<Contest | null>(null);
  const [loading, setLoading]   = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Subscribe to active contest from Firestore
  useEffect(() => {
    let innerUnsub: (() => void) | undefined;
    let outerUnsub: (() => void) | undefined;

    try {
      const { db } = getFirebaseClient();
      // "active_contest" is a well-known document ID for the current contest
      outerUnsub = onSnapshot(doc(db, "meta", "active_contest"), (snap) => {
        // Clean up previous inner subscription
        innerUnsub?.();
        innerUnsub = undefined;

        if (!snap.exists()) {
          // Fallback: query contests collection directly by status + endDate
          const now = new Date().toISOString();
          const q = query(
            collection(db, "contests"),
            where("status", "==", "active"),
            where("endDate", ">=", now),
            limit(1)
          );
          getDocs(q)
            .then((qSnap) => {
              if (!qSnap.empty) {
                const d = qSnap.docs[0];
                setContest({ ...(d.data() as Contest), id: d.id });
              } else {
                setContest(null);
              }
              setLoading(false);
            })
            .catch(() => {
              setContest(null);
              setLoading(false);
            });
          return;
        }

        const data = snap.data();
        const contestId: string = data?.contestId;
        if (!contestId) { setContest(null); setLoading(false); return; }

        // Subscribe to the actual contest document
        innerUnsub = onSnapshot(doc(db, "contests", contestId), (contestSnap) => {
          if (contestSnap.exists()) {
            const contestData = { ...(contestSnap.data() as Contest), id: contestSnap.id };
            // Only expose the contest if it is still active and not expired
            const now = new Date().toISOString();
            if (contestData.status === "active" && contestData.endDate >= now) {
              setContest(contestData);
            } else {
              setContest(null);
            }
          } else {
            setContest(null);
          }
          setLoading(false);
        });
      });
    } catch {
      setLoading(false);
    }

    return () => {
      innerUnsub?.();
      outerUnsub?.();
    };
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
