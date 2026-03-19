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
    // Extract message from any error type (Stripe SDK errors may not be plain Error instances)
    const msg: string =
      err instanceof Error
        ? err.message
        : typeof (err as Record<string, unknown>)?.message === "string"
          ? (err as Record<string, unknown>).message as string
          : String(err);

    let errorMessage = "Errore interno del server. Riprova più tardi.";
    if (msg.includes("recurring price") || msg.includes("one-time price") || msg.includes("STRIPE_PRICE_ID_PRO")) {
      errorMessage = "Configurazione abbonamento non valida: il prezzo Stripe non è ricorrente. Contatta il supporto o usa PayPal.";
    } else if (msg.includes("No such price") || msg.includes("resource_missing") || msg.includes("no such")) {
      errorMessage = "Prezzo Stripe non trovato. Contatta il supporto.";
    } else if (msg.includes("authentication") || msg.includes("STRIPE_SECRET_KEY") || msg.includes("Invalid API Key")) {
      errorMessage = "Servizio di pagamento non configurato. Usa PayPal.";
    } else if (msg.includes("subscription") && msg.includes("mode")) {
      errorMessage = "Configurazione abbonamento non valida. Usa PayPal per completare l'abbonamento.";
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
