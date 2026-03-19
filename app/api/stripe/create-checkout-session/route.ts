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
    let errorMessage = "Errore interno del server. Riprova più tardi.";
    if (err instanceof Error) {
      const msg = err.message;
      if (msg.includes("recurring price") || msg.includes("subscription") || msg.includes("STRIPE_PRICE_ID_PRO")) {
        errorMessage = "Pagamento con carta temporaneamente non disponibile. Usa PayPal per completare l'abbonamento.";
      } else if (msg.includes("No such price") || msg.includes("resource_missing")) {
        errorMessage = "Configurazione pagamento non valida. Contatta il supporto.";
      } else if (msg.includes("authentication") || msg.includes("STRIPE_SECRET_KEY")) {
        errorMessage = "Servizio di pagamento non configurato. Usa PayPal.";
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
