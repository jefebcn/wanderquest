import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { constructStripeWebhookEvent } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * Stripe Webhook Handler — Subscription lifecycle
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY          - Stripe secret key
 *   STRIPE_WEBHOOK_SECRET      - Webhook signing secret (whsec_...)
 *   STRIPE_PRICE_ID_PRO        - Price ID for the Pro plan
 *
 * Register in Stripe Dashboard → Developers → Webhooks → Listen for:
 *   checkout.session.completed
 *   customer.subscription.deleted
 *   invoice.payment_succeeded
 */

const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// ── Firestore helpers ─────────────────────────────────────────────────────

async function upgradeUserById(uid: string, subscriptionId: string) {
  const expiresAt = new Date(Date.now() + PRO_DURATION_MS).toISOString();
  await adminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        tier: "pro",
        isPremium: true,
        pointsMultiplier: 1.25,
        premiumSince: new Date().toISOString(),
        premiumExpiresAt: expiresAt,
        stripeSubscriptionId: subscriptionId,
      },
      { merge: true }
    );
  await adminAuth().setCustomUserClaims(uid, { tier: "pro" });
}

async function downgradeUserByStripeSubscriptionId(subscriptionId: string) {
  const db   = adminDb();
  const snap = await db
    .collection("users")
    .where("stripeSubscriptionId", "==", subscriptionId)
    .limit(1)
    .get();
  if (snap.empty) return;

  const uid = snap.docs[0].id;
  await snap.docs[0].ref.set(
    {
      tier: "free",
      isPremium: false,
      pointsMultiplier: 1.0,
      premiumExpiresAt: null,
      stripeSubscriptionId: null,
    },
    { merge: true }
  );
  await adminAuth().setCustomUserClaims(uid, { tier: "free" });
}

async function renewStripeSubscription(subscriptionId: string) {
  const db   = adminDb();
  const snap = await db
    .collection("users")
    .where("stripeSubscriptionId", "==", subscriptionId)
    .limit(1)
    .get();
  if (snap.empty) return;

  const expiresAt = new Date(Date.now() + PRO_DURATION_MS).toISOString();
  await snap.docs[0].ref.set({ premiumExpiresAt: expiresAt }, { merge: true });
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const payload   = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = constructStripeWebhookEvent(payload, signature);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Only handle subscription checkouts
        if (session.mode !== "subscription") break;

        const uid            = session.client_reference_id;
        const subscriptionId = session.subscription as string | null;

        if (uid && subscriptionId) {
          await upgradeUserById(uid, subscriptionId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await downgradeUserByStripeSubscriptionId(subscription.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Cast to any to handle Stripe type variations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subId = (invoice as any).subscription as string | null;
        if (subId) await renewStripeSubscription(subId);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
