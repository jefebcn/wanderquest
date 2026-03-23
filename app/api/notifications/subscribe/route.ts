/**
 * POST /api/notifications/subscribe
 *
 * Saves a Web Push subscription for a user.
 * Requires VAPID keys (VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in env).
 *
 * Body: { subscription: PushSubscriptionJSON, userId?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      userId?: string;
    };

    const { subscription, userId } = body;

    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
    }

    // Persist subscription to Firestore so the push API can target it later
    const db  = adminDb();
    const doc = db.collection("pushSubscriptions").doc();
    await doc.set({
      endpoint:  subscription.endpoint,
      keys:      subscription.keys,
      userId:    userId ?? null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, id: doc.id });
  } catch (err) {
    console.error("[push-subscribe]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/notifications/subscribe
 * Returns the VAPID public key so the client can create a subscription.
 */
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "VAPID not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
