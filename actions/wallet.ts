"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import {
  getOrCreateStripeAccount,
  createStripeOnboardingLink,
  createPayout,
  MIN_PAYOUT_CENTS,
} from "@/lib/stripe";
import type { UserWallet, WithdrawalRequest } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

export async function getWallet(idToken: string): Promise<UserWallet> {
  const decoded = await adminAuth().verifyIdToken(idToken);
  const uid = decoded.uid;
  const docSnap = await adminDb().collection("wallets").doc(uid).get();
  if (!docSnap.exists) {
    return {
      userId: uid,
      balanceCents: 0,
      pendingCents: 0,
      totalEarnedCents: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return docSnap.data() as UserWallet;
}

/**
 * Initiates Stripe Connect onboarding for a user and returns the
 * redirect URL for the Stripe-hosted onboarding flow.
 */
export async function initiateStripeOnboarding(
  idToken: string,
  baseUrl: string
): Promise<{ url: string }> {
  const decoded = await adminAuth().verifyIdToken(idToken);
  const uid     = decoded.uid;

  const userDoc = await adminDb().collection("users").doc(uid).get();
  const email   = (userDoc.data()?.email as string) ?? "";

  // Get or create Stripe Connect account
  let walletDoc = await adminDb().collection("wallets").doc(uid).get();
  let stripeAccountId = (walletDoc.data() as UserWallet | undefined)?.stripeAccountId;

  if (!stripeAccountId) {
    stripeAccountId = await getOrCreateStripeAccount(uid, email);
    await adminDb().collection("wallets").doc(uid).set(
      { stripeAccountId, userId: uid },
      { merge: true }
    );
  }

  const url = await createStripeOnboardingLink(
    stripeAccountId,
    `${baseUrl}/wallet?onboarding=success`,
    `${baseUrl}/wallet?onboarding=refresh`
  );

  return { url };
}

/**
 * Processes a withdrawal request after validating the minimum threshold
 * and that the user has a verified Stripe Connect account.
 */
export async function requestWithdrawal(
  idToken: string,
  amountCents: number,
  method: "stripe" | "paypal"
): Promise<{ success: boolean; message: string }> {
  const decoded = await adminAuth().verifyIdToken(idToken);
  const uid     = decoded.uid;

  if (amountCents < MIN_PAYOUT_CENTS) {
    return {
      success: false,
      message: `Importo minimo prelievo: €${MIN_PAYOUT_CENTS / 100}.`,
    };
  }

  const walletDoc  = await adminDb().collection("wallets").doc(uid).get();
  const wallet     = walletDoc.data() as UserWallet | undefined;

  if (!wallet || wallet.balanceCents < amountCents) {
    return { success: false, message: "Saldo insufficiente." };
  }

  if (method === "stripe" && !wallet.stripeAccountId) {
    return { success: false, message: "Collega prima il tuo account Stripe." };
  }

  const db          = adminDb();
  const withdrawRef = db.collection("withdrawals").doc();
  const now         = new Date().toISOString();

  const withdrawal: Omit<WithdrawalRequest, "id"> = {
    userId: uid,
    amountCents,
    method,
    status: "pending",
    createdAt: now,
  };

  // Atomic: deduct balance, create withdrawal record
  await db.runTransaction(async (tx) => {
    tx.set(withdrawRef, withdrawal);
    tx.update(db.collection("wallets").doc(uid), {
      balanceCents:  FieldValue.increment(-amountCents),
      pendingCents:  FieldValue.increment(amountCents),
    });
  });

  // Trigger payout asynchronously (in production, use a Cloud Function queue)
  if (method === "stripe" && wallet.stripeAccountId) {
    try {
      await createPayout(wallet.stripeAccountId, amountCents);
      await db.collection("withdrawals").doc(withdrawRef.id).update({
        status:      "completed",
        completedAt: new Date().toISOString(),
      });
      await db.collection("wallets").doc(uid).update({
        pendingCents: FieldValue.increment(-amountCents),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db.collection("withdrawals").doc(withdrawRef.id).update({
        status:        "failed",
        failureReason: msg,
      });
      await db.collection("wallets").doc(uid).update({
        balanceCents: FieldValue.increment(amountCents),
        pendingCents: FieldValue.increment(-amountCents),
      });
      return { success: false, message: `Pagamento fallito: ${msg}` };
    }
  }

  return { success: true, message: "Prelievo richiesto con successo!" };
}
