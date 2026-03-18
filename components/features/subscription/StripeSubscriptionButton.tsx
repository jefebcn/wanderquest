"use client";

/**
 * StripeSubscriptionButton
 *
 * Redirects the user to Stripe Checkout for the Pro subscription.
 * Requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in env.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";

interface Props {
  onSuccess?: () => void;
}

export function StripeSubscriptionButton({ onSuccess: _onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser?.getIdToken();
      if (!tok) throw new Error("Devi essere autenticato");

      const res = await fetch("/api/stripe/create-checkout-session", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ idToken: tok }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Errore nella creazione del pagamento");

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/6 py-3.5 text-sm font-black text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CreditCard size={16} className="text-blue-400" />
        )}
        {loading ? "Reindirizzamento…" : "Paga con carta di credito"}
      </motion.button>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <p className="text-center text-[10px] text-white/25">
        Pagamento sicuro via Stripe · Visa, Mastercard, Apple Pay
      </p>
    </div>
  );
}
