"use client";

import { useState, useEffect } from "react";
import { getAuth }    from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { getWallet, requestWithdrawal, initiateStripeOnboarding } from "@/actions/wallet";
import { WalletSkeleton } from "@/components/ui/Skeleton";
import { formatCents }   from "@/lib/utils";
import type { UserWallet } from "@/types";
import { Wallet, ArrowDownToLine, CreditCard, AlertCircle } from "lucide-react";

export function WalletView() {
  const [wallet, setWallet]     = useState<UserWallet | null>(null);
  const [loading, setLoading]   = useState(true);
  const [amount, setAmount]     = useState("");
  const [method, setMethod]     = useState<"stripe" | "paypal">("stripe");
  const [message, setMessage]   = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy]         = useState(false);

  const loadWallet = async () => {
    const { auth } = getFirebaseClient();
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    try {
      const tok = await user.getIdToken();
      const w   = await getWallet(tok);
      setWallet(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWallet(); }, []);

  const handleWithdraw = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents < 500) {
      setMessage({ ok: false, text: "Importo minimo: €5.00" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser!.getIdToken();
      const res = await requestWithdrawal(tok, cents, method);
      setMessage({ ok: res.success, text: res.message });
      if (res.success) { setAmount(""); loadWallet(); }
    } finally {
      setBusy(false);
    }
  };

  const handleStripeSetup = async () => {
    setBusy(true);
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser!.getIdToken();
      const { url } = await initiateStripeOnboarding(tok, window.location.origin);
      window.location.href = url;
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="bg-[#080C1A] min-h-screen pt-14"><WalletSkeleton /></div>;

  if (!wallet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080C1A] px-6 text-center text-white">
        <Wallet size={48} className="text-amber-400/40" />
        <p className="font-bold">Portafoglio non disponibile</p>
        <p className="text-xs text-white/40">Accumula punti nelle classifiche per sbloccare i premi.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C1A] pb-24 text-white">
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#080C1A]/95 px-4 pt-14 pb-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Wallet className="text-amber-400" size={22} />
          <h1 className="text-xl font-black">Portafoglio</h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* Balance card */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-transparent border border-amber-400/20 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70 mb-1">Saldo disponibile</p>
          <p className="text-4xl font-black text-amber-400">{formatCents(wallet.balanceCents)}</p>
          {wallet.pendingCents > 0 && (
            <p className="text-xs text-white/40 mt-1">
              {formatCents(wallet.pendingCents)} in elaborazione
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs">Totale guadagnato</p>
              <p className="font-bold">{formatCents(wallet.totalEarnedCents)}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Prelievi</p>
              <p className="font-bold">{formatCents(wallet.totalEarnedCents - wallet.balanceCents)}</p>
            </div>
          </div>
        </div>

        {/* Stripe connect */}
        {!wallet.stripeAccountId && (
          <div className="rounded-2xl bg-white/4 border border-white/10 p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm font-bold">Collega il tuo account pagamenti</p>
              <p className="text-xs text-white/40 mt-0.5">Necessario per ricevere i premi sul tuo conto.</p>
              <button
                onClick={handleStripeSetup}
                disabled={busy}
                className="mt-3 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-black text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                <CreditCard size={13} className="inline mr-1.5" />
                Configura Stripe
              </button>
            </div>
          </div>
        )}

        {/* Withdrawal form */}
        <div className="rounded-2xl bg-white/4 border border-white/10 p-4 space-y-3">
          <h2 className="font-bold text-sm">Richiedi prelievo</h2>

          <div className="flex gap-2">
            {(["stripe", "paypal"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  method === m
                    ? "bg-amber-400/20 border border-amber-400/40 text-amber-400"
                    : "bg-white/6 text-white/40"
                }`}
              >
                {m === "stripe" ? "💳 Stripe" : "🅿️ PayPal"}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">€</span>
            <input
              type="number"
              min="5"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-white/6 border border-white/10 pl-7 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          {message && (
            <p className={`text-xs rounded-xl px-3 py-2 ${message.ok ? "bg-green-500/15 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleWithdraw}
            disabled={busy || !amount || wallet.balanceCents < 500}
            className="w-full rounded-xl bg-amber-400 py-3 text-sm font-black text-[#080C1A] disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <ArrowDownToLine size={16} />
            {busy ? "Elaborazione…" : "Preleva ora"}
          </button>
          <p className="text-xs text-white/30 text-center">Prelievo minimo: €5 · Elaborato in 1–3 giorni</p>
        </div>
      </div>
    </div>
  );
}
