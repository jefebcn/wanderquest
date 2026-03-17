import Stripe from "stripe";

export const MIN_PAYOUT_CENTS = 500; // €5 minimum withdrawal

// Lazily initialised — build succeeds even without STRIPE_SECRET_KEY
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover", typescript: true });
}

/**
 * Creates or retrieves a Stripe Connect Express account for a user.
 * Called when the user first sets up their wallet.
 */
export async function getOrCreateStripeAccount(
  userId: string,
  email: string
): Promise<string> {
  const account = await getStripe().accounts.create({
    type:  "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: { userId },
  });
  return account.id;
}

/**
 * Creates an account onboarding link for Stripe Connect.
 */
export async function createStripeOnboardingLink(
  stripeAccountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const link = await getStripe().accountLinks.create({
    account:     stripeAccountId,
    return_url:  returnUrl,
    refresh_url: refreshUrl,
    type:        "account_onboarding",
  });
  return link.url;
}

/**
 * Transfers funds from the platform account to the user's Connect account.
 */
export async function createPayout(
  stripeAccountId: string,
  amountCents: number,
  currency = "eur"
): Promise<Stripe.Transfer> {
  return getStripe().transfers.create({
    amount:      amountCents,
    currency,
    destination: stripeAccountId,
    metadata:    { reason: "contest_prize" },
  });
}
