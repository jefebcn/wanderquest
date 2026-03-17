import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

/**
 * PayPal Webhook Handler
 *
 * Handles subscription lifecycle events from PayPal and syncs subscription
 * status to Firebase (Firestore + Custom Claims).
 *
 * Required env vars:
 *   PAYPAL_CLIENT_ID          - PayPal app client ID (server-side only)
 *   PAYPAL_CLIENT_SECRET      - PayPal app secret
 *   PAYPAL_WEBHOOK_ID         - From PayPal Developer Dashboard → Webhooks
 *   PAYPAL_ENV                - "sandbox" | "live"  (default: "sandbox")
 *
 * Register in PayPal Dashboard → Webhooks → Listen for:
 *   BILLING.SUBSCRIPTION.ACTIVATED
 *   BILLING.SUBSCRIPTION.CANCELLED
 *   BILLING.SUBSCRIPTION.EXPIRED
 *   BILLING.SUBSCRIPTION.SUSPENDED
 *   PAYMENT.SALE.COMPLETED
 */

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// ── PayPal REST helpers ───────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function verifySignature(
  rawBody: string,
  headers: Record<string, string | null>,
  accessToken: string
): Promise<boolean> {
  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo:         headers["paypal-auth-algo"],
        cert_url:          headers["paypal-cert-url"],
        transmission_id:   headers["paypal-transmission-id"],
        transmission_sig:  headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id:        process.env.PAYPAL_WEBHOOK_ID,
        webhook_event:     JSON.parse(rawBody),
      }),
    }
  );
  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === "SUCCESS";
}

// ── Firestore helpers ─────────────────────────────────────────────────────

async function upgradeUserByEmail(email: string, subscriptionId: string) {
  const db   = adminDb();
  const snap = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snap.empty) return;

  const uid       = snap.docs[0].id;
  const expiresAt = new Date(Date.now() + PRO_DURATION_MS).toISOString();

  await snap.docs[0].ref.set(
    {
      tier: "pro",
      isPremium: true,
      pointsMultiplier: 1.25,
      premiumSince: new Date().toISOString(),
      premiumExpiresAt: expiresAt,
      paypalSubscriptionId: subscriptionId,
    },
    { merge: true }
  );
  await adminAuth().setCustomUserClaims(uid, { tier: "pro" });
}

async function downgradeUserBySubscriptionId(subscriptionId: string) {
  const db   = adminDb();
  const snap = await db
    .collection("users")
    .where("paypalSubscriptionId", "==", subscriptionId)
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
    },
    { merge: true }
  );
  await adminAuth().setCustomUserClaims(uid, { tier: "free" });
}

async function renewSubscription(subscriptionId: string) {
  const db   = adminDb();
  const snap = await db
    .collection("users")
    .where("paypalSubscriptionId", "==", subscriptionId)
    .limit(1)
    .get();
  if (snap.empty) return;

  const expiresAt = new Date(Date.now() + PRO_DURATION_MS).toISOString();
  await snap.docs[0].ref.set({ premiumExpiresAt: expiresAt }, { merge: true });
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ── Signature verification ────────────────────────────────────
  try {
    const token    = await getAccessToken();
    const verified = await verifySignature(
      rawBody,
      {
        "paypal-auth-algo":         req.headers.get("paypal-auth-algo"),
        "paypal-cert-url":          req.headers.get("paypal-cert-url"),
        "paypal-transmission-id":   req.headers.get("paypal-transmission-id"),
        "paypal-transmission-sig":  req.headers.get("paypal-transmission-sig"),
        "paypal-transmission-time": req.headers.get("paypal-transmission-time"),
      },
      token
    );

    if (!verified) {
      console.error("[paypal-webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (err) {
    console.error("[paypal-webhook] Verification error:", err);
    return NextResponse.json({ error: "Verification error" }, { status: 400 });
  }

  // ── Event routing ─────────────────────────────────────────────
  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const subId = event.resource.id as string;
        const email = (
          event.resource.subscriber as Record<string, unknown> | undefined
        )?.email_address as string | undefined;
        if (email) await upgradeUserByEmail(email, subId);
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subId = event.resource.id as string;
        await downgradeUserBySubscriptionId(subId);
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        // Recurring billing — extend expiry by another 30 days
        const subId = event.resource.billing_agreement_id as string | undefined;
        if (subId) await renewSubscription(subId);
        break;
      }

      default:
        // Unhandled event — acknowledge to prevent PayPal retry
        break;
    }
  } catch (err) {
    console.error("[paypal-webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
