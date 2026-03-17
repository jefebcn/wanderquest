import Stripe from "stripe";

// Server-side only
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export const MIN_PAYOUT_CENTS = 500; // €5 minimum withdrawal

/**
 * Creates or retrieves a Stripe Connect Express account for a user.
 * Called when the user first sets up their wallet.
 */
export async function getOrCreateStripeAccount(
  userId: string,
  email: string
): Promise<string> {
  const account = await stripe.accounts.create({
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
  const link = await stripe.accountLinks.create({
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
  return stripe.transfers.create({
    amount:      amountCents,
    currency,
    destination: stripeAccountId,
    metadata:    { reason: "contest_prize" },
  });
}
