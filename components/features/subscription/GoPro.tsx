"use client";

/**
 * GoPro — Liquid-glass paywall card.
 *
 * Shown inside Profile and Wallet tabs for free users.
 * For Pro users, renders a compact "Pro Status" management panel instead.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Zap, Map, ArrowUpCircle, Sparkles, CheckCircle2,
  CalendarDays, X, MessageSquare, Tag,
} from "lucide-react";
import { PayPalSubscriptionButton } from "./PayPalSubscriptionButton";
import { cancelProSubscription }    from "@/actions/subscription";
import { getFirebaseClient }        from "@/lib/firebase/client";
import { useSubscription }          from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

// ── Benefit list ──────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: Zap,
    title: "+25% Boost Punti",
    desc:  "Su ogni scan — salga in classifica più velocemente.",
    color: "text-[#FFD700]",
    glow:  "rgba(255,215,0,0.15)",
  },
  {
    icon: Map,
    title: "Elite Quests",
    desc:  "Landmark esclusivi con premi più alti.",
    color: "text-purple-400",
    glow:  "rgba(168,85,247,0.15)",
  },
  {
    icon: ArrowUpCircle,
    title: "Payout Prioritari",
    desc:  "I tuoi prelievi vengono elaborati in 24h invece di 3 giorni.",
    color: "text-blue-400",
    glow:  "rgba(96,165,250,0.15)",
  },
  {
    icon: MessageSquare,
    title: "AI Concierge",
    desc:  "Assistente AI GPT-4o: suggerisce il prossimo monumento in base a meteo e posizione.",
    color: "text-cyan-400",
    glow:  "rgba(34,211,238,0.15)",
  },
  {
    icon: Tag,
    title: "Local Deals",
    desc:  "Coupon esclusivi da ristoranti, bar e musei partner a Barcellona.",
    color: "text-green-400",
    glow:  "rgba(74,222,128,0.15)",
  },
];

// ── Pro Status panel (when already subscribed) ────────────────────────────

function ProStatusPanel({ onCancel }: { onCancel: () => void }) {
  const { premiumExpiresAt } = useSubscription();
  const [confirming, setConfirming] = useState(false);

  const renewDate = premiumExpiresAt
    ? new Date(premiumExpiresAt).toLocaleDateString("it-IT", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/6 p-4 space-y-3"
      style={{ boxShadow: "0 4px 24px rgba(255,215,0,0.08)" }}
    >
      <div className="flex items-center gap-2">
        <Crown size={16} className="text-[#FFD700]" />
        <p className="font-black text-sm text-[#FFD700]">WanderQuest Pro Attivo</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-white/45">
        <CalendarDays size={12} />
        <span>Rinnovo automatico il {renewDate}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {BENEFITS.map((b) => (
          <span key={b.title}
            className={cn("inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold", b.color)}
          >
            <b.icon size={8} />
            {b.title}
          </span>
        ))}
      </div>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-[11px] text-white/25 hover:text-white/45 transition-colors"
        >
          Cancella abbonamento
        </button>
      ) : (
        <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-3 space-y-2">
          <p className="text-xs text-red-400 font-bold">Sicuro di cancellare?</p>
          <p className="text-[10px] text-white/35">Perderai il boost punti e gli Elite Quests.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-xl bg-white/8 py-2 text-xs font-bold text-white/60"
            >
              Torna indietro
            </button>
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl bg-red-500/20 border border-red-500/30 py-2 text-xs font-black text-red-400"
            >
              Cancella Pro
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Paywall card ──────────────────────────────────────────────────────────

interface Props {
  /** Compact variant for Profile; full for Wallet */
  variant?: "compact" | "full";
}

export function GoPro({ variant = "full" }: Props) {
  const { isPro } = useSubscription();
  const [open, setOpen]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser?.getIdToken();
      if (tok) await cancelProSubscription(tok);
      await auth.currentUser?.getIdToken(true); // refresh claims
    } finally {
      setCancelling(false);
    }
  };

  if (isPro) return <ProStatusPanel onCancel={handleCancel} />;

  // ── Compact trigger button ─────────────────────────────────────────────
  if (variant === "compact" && !open) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between rounded-2xl border border-[#FFD700]/22 bg-[#FFD700]/6 px-4 py-3"
        style={{ boxShadow: "0 4px 20px rgba(255,215,0,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <Crown size={15} className="text-[#FFD700]" />
          <span className="text-sm font-black text-[#FFD700]">Passa a Pro</span>
        </div>
        <span className="text-[11px] text-white/40 font-bold">€4,99/mese →</span>
      </motion.button>
    );
  }

  // ── Full liquid-glass paywall card ─────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="relative overflow-hidden rounded-3xl border border-white/18"
      style={{
        // Liquid-glass: frosted gradient + physically accurate refraction layers
        background:
          "linear-gradient(140deg, rgba(255,215,0,0.06) 0%, rgba(15,18,40,0.96) 45%, rgba(0,0,0,0.88) 100%)",
        backdropFilter: "blur(40px) saturate(1.6)",
        boxShadow:
          "0 24px 80px rgba(255,215,0,0.10)," +
          "0 8px 32px rgba(0,0,0,0.6)," +
          "inset 0 1px 0 rgba(255,255,255,0.14)," +
          "inset 0 -1px 0 rgba(0,0,0,0.5)," +
          "inset 1px 0 0 rgba(255,255,255,0.06)," +
          "inset -1px 0 0 rgba(0,0,0,0.4)",
      }}
    >
      {/* Refraction highlight layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.03) 100%)",
        }}
      />
      {/* Gold glow orb */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#FFD700]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />

      <div className="relative z-0 p-5">
        {/* Close button (compact modal variant) */}
        {variant === "compact" && (
          <button onClick={() => setOpen(false)} className="absolute top-4 right-4">
            <X size={16} className="text-white/25" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg,#FFD700,#f59e0b)",
              boxShadow: "0 4px 16px rgba(255,215,0,0.45)",
            }}
          >
            <Crown size={22} className="text-slate-900" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
              Abbonamento Premium
            </p>
            <h2 className="text-xl font-black text-white">WanderQuest Pro</h2>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-[#FFD700]">€4,99</p>
            <p className="text-[10px] text-white/40">/mese</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2.5 mb-5">
          {BENEFITS.map(({ icon: Icon, title, desc, color, glow }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 + i * 0.06 }}
              className="flex items-start gap-3 rounded-2xl bg-white/[0.04] border border-white/8 p-3"
              style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06), 0 2px 12px ${glow}` }}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: glow }}
              >
                <Icon size={15} className={color} />
              </div>
              <div>
                <p className={cn("text-xs font-black", color)}>{title}</p>
                <p className="text-[10px] text-white/40 leading-snug mt-0.5">{desc}</p>
              </div>
              <CheckCircle2 size={13} className="text-white/20 flex-shrink-0 mt-0.5 ml-auto" />
            </motion.div>
          ))}
        </div>

        {/* PayPal subscription button */}
        <PayPalSubscriptionButton onSuccess={() => setOpen(false)} />

        {/* Social proof */}
        <div className="flex items-center gap-2 mt-4 justify-center">
          <Sparkles size={11} className="text-[#FFD700]/50" />
          <p className="text-[10px] text-white/25">
            Cancella in qualsiasi momento · Nessun impegno a lungo termine
          </p>
        </div>
      </div>
    </motion.div>
  );
}
