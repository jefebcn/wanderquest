"use client";

/**
 * PayPalSubscriptionButton
 *
 * Two flows:
 *   1. Automated  — PayPalButtons onApprove → activateProSubscription server action
 *   2. Manual     — "Già pagato?" modal → submit Transaction ID + optional screenshot
 *
 * Requires NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO in env.local.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import {
  activateProSubscription,
  submitManualVerification,
} from "@/actions/subscription";
import { getFirebaseClient } from "@/lib/firebase/client";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSuccess?: () => void;
}

export function PayPalSubscriptionButton({ onSuccess }: Props) {
  const [{ isPending }]               = usePayPalScriptReducer();
  const [status, setStatus]           = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg]     = useState("");
  const [showManual, setShowManual]   = useState(false);
  const [txId, setTxId]               = useState("");
  const [screenshot, setScreenshot]   = useState<File | null>(null);
  const [manualBusy, setManualBusy]   = useState(false);
  const fileRef                       = useRef<HTMLInputElement>(null);

  const planId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO ?? "";

  // ── Automated flow ──────────────────────────────────────────────────────

  const handleApprove = async (subscriptionId: string) => {
    setStatus("loading");
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser?.getIdToken();
      if (!tok) throw new Error("Non autenticato");

      const res = await activateProSubscription(tok, subscriptionId);
      if (res.success) {
        setStatus("success");
        setStatusMsg(res.message);
        // Force token refresh so custom claim takes effect immediately
        await auth.currentUser?.getIdToken(true);
        onSuccess?.();
      } else {
        setStatus("error");
        setStatusMsg(res.message);
      }
    } catch (err) {
      setStatus("error");
      setStatusMsg(err instanceof Error ? err.message : "Errore imprevisto");
    }
  };

  // ── Manual fallback ─────────────────────────────────────────────────────

  const handleManualSubmit = async () => {
    if (!txId.trim()) return;
    setManualBusy(true);
    try {
      let screenshotUrl: string | undefined;

      // Upload screenshot to Firebase Storage if provided
      if (screenshot) {
        const { storage } = getFirebaseClient();
        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
        const { auth } = getFirebaseClient();
        const uid      = auth.currentUser?.uid;
        const storRef  = ref(storage, `subscription_reviews/${uid}/${Date.now()}_${screenshot.name}`);
        await uploadBytes(storRef, screenshot);
        screenshotUrl = await getDownloadURL(storRef);
      }

      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser?.getIdToken();
      if (!tok) throw new Error("Non autenticato");

      const res = await submitManualVerification(tok, txId.trim(), screenshotUrl);
      setStatus(res.success ? "success" : "error");
      setStatusMsg(res.message);
      if (res.success) setShowManual(false);
    } catch (err) {
      setStatus("error");
      setStatusMsg(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setManualBusy(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-4 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 border border-green-500/30">
          <CheckCircle2 size={28} className="text-green-400" />
        </div>
        <p className="font-black text-white text-base">{statusMsg}</p>
        <p className="text-xs text-white/40">Benvenuto nella lega dei Legend!</p>
      </motion.div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-5 text-white/50">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm font-bold">Attivazione in corso…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* PayPal Buttons */}
      {isPending ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={18} className="animate-spin text-white/30" />
        </div>
      ) : planId ? (
        <div className="rounded-xl overflow-hidden">
          <PayPalButtons
            style={{ shape: "pill", color: "gold", label: "subscribe", height: 48 }}
            createSubscription={(_data, actions) =>
              actions.subscription.create({ plan_id: planId })
            }
            onApprove={async (data) => {
              if (data.subscriptionID) await handleApprove(data.subscriptionID);
            }}
            onError={(err) => {
              setStatus("error");
              setStatusMsg(String(err));
            }}
          />
        </div>
      ) : (
        <p className="text-xs text-amber-400/70 text-center py-2">
          Configura NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO per abilitare i pagamenti.
        </p>
      )}

      {/* Error banner */}
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{statusMsg}</p>
        </div>
      )}

      {/* Manual fallback trigger */}
      <button
        onClick={() => setShowManual(true)}
        className="w-full text-center text-xs text-white/30 hover:text-white/55 transition-colors pt-1"
      >
        Già pagato tramite link? Inserisci l&apos;ID transazione
      </button>

      {/* Manual modal */}
      <AnimatePresence>
        {showManual && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="rounded-2xl border border-white/12 bg-slate-900/95 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-black">Verifica manuale</p>
              <button onClick={() => setShowManual(false)}>
                <X size={16} className="text-white/30" />
              </button>
            </div>

            <input
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder="ID transazione PayPal (es. 1AB23456CD…)"
              className="w-full rounded-xl bg-white/6 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50"
            />

            {/* Screenshot upload */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-colors",
                screenshot
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-white/10 bg-white/4 text-white/40 hover:text-white/60"
              )}
            >
              <Upload size={13} />
              {screenshot ? screenshot.name : "Carica screenshot (opzionale)"}
            </button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleManualSubmit}
              disabled={manualBusy || !txId.trim()}
              className="w-full rounded-xl bg-[var(--s-primary)] py-3 text-sm font-black text-slate-900 disabled:opacity-40 hover:bg-yellow-300 transition-colors"
            >
              {manualBusy ? "Invio…" : "Invia per revisione"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
