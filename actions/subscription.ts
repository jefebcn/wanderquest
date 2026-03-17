"use server";

/**
 * Subscription server actions.
 *
 * All writes to user tier/claims happen here — never on the client — so that
 * subscription status cannot be tampered with via the browser.
 */

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import type { SubscriptionActivation } from "@/types";

const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Helpers ───────────────────────────────────────────────────────────────

function expiresAt(from: Date = new Date()): string {
  return new Date(from.getTime() + PRO_DURATION_MS).toISOString();
}

// ── Public actions ────────────────────────────────────────────────────────

/**
 * Called on successful PayPal onApprove with the subscription ID.
 * Sets tier:"pro" in Firestore AND as a Firebase Custom Claim so Firestore
 * rules can reference `request.auth.token.tier == "pro"`.
 */
export async function activateProSubscription(
  idToken: string,
  subscriptionId: string
): Promise<SubscriptionActivation> {
  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return { success: false, message: "Non autenticato." };
  }

  const now = new Date().toISOString();

  await adminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        tier: "pro",
        isPremium: true,
        pointsMultiplier: 1.25,
        premiumSince: now,
        premiumExpiresAt: expiresAt(),
        paypalSubscriptionId: subscriptionId,
      },
      { merge: true }
    );

  // Firebase Custom Claim — read by Firestore rules & id-token-result on client
  await adminAuth().setCustomUserClaims(uid, { tier: "pro" });

  return { success: true, message: "🎉 Benvenuto in WanderQuest Pro!" };
}

/**
 * Cancel / downgrade — keeps existing points but removes multiplier.
 */
export async function cancelProSubscription(
  idToken: string
): Promise<SubscriptionActivation> {
  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return { success: false, message: "Non autenticato." };
  }

  await adminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        tier: "free",
        isPremium: false,
        pointsMultiplier: 1.0,
        premiumExpiresAt: null,
        paypalSubscriptionId: null,
      },
      { merge: true }
    );

  await adminAuth().setCustomUserClaims(uid, { tier: "free" });

  return { success: true, message: "Abbonamento cancellato." };
}

/**
 * Manual fallback: user provides a PayPal Transaction ID and/or uploads
 * a screenshot.  Creates a review record for the admin to process.
 */
export async function submitManualVerification(
  idToken: string,
  transactionId: string,
  screenshotUrl?: string
): Promise<SubscriptionActivation> {
  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return { success: false, message: "Non autenticato." };
  }

  await adminDb().collection("manual_subscription_reviews").add({
    uid,
    transactionId,
    screenshotUrl: screenshotUrl ?? null,
    status: "pending",
    submittedAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Richiesta inviata! Verifica manuale entro 24h lavorative.",
  };
}
