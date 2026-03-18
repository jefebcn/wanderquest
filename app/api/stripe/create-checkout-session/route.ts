import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createSubscriptionCheckoutSession } from "@/lib/stripe";

/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for a Pro subscription.
 * Returns { url } to redirect the user.
 *
 * Body: { idToken: string }
 */
export async function POST(req: NextRequest) {
  let idToken: string;
  try {
    const body = await req.json();
    idToken = body.idToken;
    if (!idToken) throw new Error("Missing idToken");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let uid: string;
  let email: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid   = decoded.uid;
    email = decoded.email ?? "";
  } catch {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wanderquest.app";

  try {
    const url = await createSubscriptionCheckoutSession(
      uid,
      email,
      `${appUrl}/profile?stripe=success`,
      `${appUrl}/profile?stripe=cancel`
    );
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[stripe-checkout] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore interno" },
      { status: 500 }
    );
  }
}
