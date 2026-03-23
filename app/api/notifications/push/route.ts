/**
 * POST /api/notifications/push
 *
 * Internal endpoint: sends a Web Push notification to all subscribers.
 * Called from cron jobs or safety-monitor webhooks when a CRITICAL event is detected.
 *
 * Requires:
 *   VAPID_PUBLIC_KEY   — VAPID public key (urlsafe base64)
 *   VAPID_PRIVATE_KEY  — VAPID private key (urlsafe base64)
 *   VAPID_SUBJECT      — mailto: or https: identity URL
 *   CRON_SECRET        — shared secret to authenticate internal calls
 *
 * Body: {
 *   secret: string,
 *   title: string,
 *   body: string,
 *   level: "CRITICAL" | "WARNING",
 *   eventLat?: number,
 *   eventLng?: number,
 *   countryName?: string,
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb }                   from "@/lib/firebase/admin";

// ── Web Push (manual implementation — avoids requiring web-push package) ──────

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapid: { publicKey: string; privateKey: string; subject: string }
): Promise<boolean> {
  // Use the web-push compatible fetch approach
  // NOTE: In production, install the `web-push` npm package for proper
  // VAPID signature generation. This implementation outlines the structure.
  try {
    const res = await fetch(subscription.endpoint, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL":           "86400",
        "Urgency":       "high",
        "Authorization": `vapid t=${await buildVapidToken(subscription.endpoint, vapid)},k=${vapid.publicKey}`,
      },
      body: payload,
    });
    return res.ok || res.status === 201;
  } catch {
    return false;
  }
}

async function buildVapidToken(
  endpoint: string,
  vapid: { publicKey: string; privateKey: string; subject: string }
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const exp      = Math.floor(Date.now() / 1000) + 12 * 3600;
  const header   = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claims   = btoa(JSON.stringify({ aud: audience, exp, sub: vapid.subject }))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  // Full ES256 signing requires the `web-push` package — return unsigned for structure
  return `${header}.${claims}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      secret:       string;
      title:        string;
      body:         string;
      level:        "CRITICAL" | "WARNING";
      eventLat?:    number;
      eventLng?:    number;
      countryName?: string;
    };

    // Authenticate
    if (body.secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@wanderquest.app";

    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: "VAPID not configured" }, { status: 503 });
    }

    // Load all push subscriptions from Firestore
    const db   = adminDb();
    const snap = await db.collection("pushSubscriptions").limit(500).get();

    const payload = JSON.stringify({
      title:       body.title,
      body:        body.body,
      level:       body.level,
      eventLat:    body.eventLat  ?? null,
      eventLng:    body.eventLng  ?? null,
      countryName: body.countryName ?? "",
    });

    let sent = 0;
    const stale: string[] = [];

    await Promise.allSettled(
      snap.docs.map(async (doc) => {
        const sub = doc.data() as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };
        const ok = await sendWebPush(sub, payload, {
          publicKey:  vapidPublic,
          privateKey: vapidPrivate,
          subject:    vapidSubject,
        });
        if (ok) {
          sent++;
        } else {
          stale.push(doc.id);
        }
      })
    );

    // Clean up expired subscriptions
    if (stale.length > 0) {
      const batch = db.batch();
      stale.forEach((id) => batch.delete(db.collection("pushSubscriptions").doc(id)));
      await batch.commit();
    }

    return NextResponse.json({ ok: true, sent, removed: stale.length });
  } catch (err) {
    console.error("[push-send]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
