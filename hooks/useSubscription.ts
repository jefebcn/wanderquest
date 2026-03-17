"use client";

/**
 * useSubscription — real-time subscription tier from Firestore.
 *
 * Reads the `tier` and `premiumExpiresAt` fields from the users/{uid}
 * document so the UI updates instantly after an activateProSubscription()
 * call without waiting for an ID-token refresh cycle.
 *
 * For security decisions (API route gating) use the Firebase Custom Claim
 * `tier` instead; this hook is for UI-only conditional rendering.
 */

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { useAuth } from "./useAuth";

export interface SubscriptionState {
  tier: "free" | "pro";
  isPro: boolean;
  pointsMultiplier: number;
  premiumExpiresAt?: string;
  paypalSubscriptionId?: string;
  loading: boolean;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: "free",
    isPro: false,
    pointsMultiplier: 1.0,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState({ tier: "free", isPro: false, pointsMultiplier: 1.0, loading: false });
      return;
    }

    const { db } = getFirebaseClient();
    const userRef = doc(db, "users", user.uid);

    const unsub = onSnapshot(userRef, (snap) => {
      const d = snap.data() ?? {};
      const tier = (d.tier as "free" | "pro") ?? "free";
      setState({
        tier,
        isPro:               tier === "pro",
        pointsMultiplier:    (d.pointsMultiplier as number) ?? 1.0,
        premiumExpiresAt:    d.premiumExpiresAt as string | undefined,
        paypalSubscriptionId: d.paypalSubscriptionId as string | undefined,
        loading: false,
      });
    });

    return unsub;
  }, [user]);

  return state;
}
