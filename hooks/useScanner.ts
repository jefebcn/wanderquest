"use client";

import { useState, useCallback } from "react";
import { getAuth } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { validateCheckIn } from "@/actions/contest";
import type { CheckInResult, Landmark } from "@/types";

export type ScannerState =
  | "idle"
  | "checking"
  | "success"
  | "too-far"
  | "already-visited"
  | "error";

export function useScanner(contestId?: string) {
  const [state, setState]   = useState<ScannerState>("idle");
  const [result, setResult] = useState<CheckInResult | null>(null);

  const checkIn = useCallback(
    async (landmark: Landmark, userLat: number, userLng: number) => {
      setState("checking");
      setResult(null);

      try {
        const { auth } = getFirebaseClient();
        const user = auth.currentUser;
        if (!user) {
          setState("error");
          setResult({ success: false, pointsEarned: 0, distanceMetres: 0, message: "Devi essere loggato." });
          return;
        }

        const idToken = await user.getIdToken();
        const res = await validateCheckIn(idToken, {
          landmarkId: landmark.id,
          userLat,
          userLng,
          contestId,
        });

        setResult(res);

        if (res.success) {
          setState("success");
          // Haptic feedback — success pattern
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(
              res.streakBonus && res.streakBonus > 0
                ? [80, 40, 80, 40, 200]   // bonus prize pattern — stronger
                : [80, 40, 80]             // standard success
            );
          }
        } else if (res.message.includes("troppo lontano")) {
          setState("too-far");
        } else if (res.message.includes("24 ore")) {
          setState("already-visited");
        } else {
          setState("error");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore sconosciuto";
        setResult({ success: false, pointsEarned: 0, distanceMetres: 0, message: msg });
        setState("error");
      }
    },
    [contestId]
  );

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
  }, []);

  return { state, result, checkIn, reset };
}
