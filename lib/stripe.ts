import Stripe from "stripe";

export const MIN_PAYOUT_CENTS = 500; // €5 minimum withdrawal

// Lazily initialised — build succeeds even without STRIPE_SECRET_KEY
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover", typescript: true });
}

// ── Subscription helpers ──────────────────────────────────────────────────

/**
 * Creates a Stripe Checkout Session for a Pro subscription.
 * Returns the session URL to redirect the user to.
 */
export async function createSubscriptionCheckoutSession(
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!priceId) throw new Error("STRIPE_PRICE_ID_PRO is not set");

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: userEmail,
    client_reference_id: userId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { userId },
    },
  });

  if (!session.url) throw new Error("Stripe session URL not returned");
  return session.url;
}

/**
 * Cancels a Stripe subscription at the end of the billing period.
 */
export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Constructs and verifies a Stripe webhook event.
 */
export function constructStripeWebhookEvent(
  payload: string,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return getStripe().webhooks.constructEvent(payload, signature, secret);
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
