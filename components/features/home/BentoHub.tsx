"use client";

/**
 * BentoHub — modular grid of "live" tiles shown below the hero.
 *
 * Layout (mobile-first, 2-column grid):
 *  ┌───────────────────────────────────────┐
 *  │  MAP TILE — Esplora i Dintorni  (2col)│  row 1 (tall)
 *  ├──────────────────┬────────────────────┤
 *  │  Safety indicator│  Leaderboard rank  │  row 2 (medium)
 *  ├──────────────────┴────────────────────┤
 *  │  AI Travel Tip               (2col)   │  row 3 (compact)
 *  └───────────────────────────────────────┘
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Trophy,
  Sparkles,
  Navigation,
  TrendingUp,
} from "lucide-react";
import { useAuth }        from "@/hooks/useAuth";
import { useContest }     from "@/hooks/useContest";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { cn }             from "@/lib/utils";
import type { SafetyLevel } from "@/types";

// ── Map Tile ─────────────────────────────────────────────────────────────────

function MapTile() {
  return (
    <Link href="/scan" className="block col-span-2">
      <div
        className="relative h-52 rounded-2xl overflow-hidden border border-white/8 cursor-pointer"
        style={{
          background:
            "radial-gradient(ellipse at 40% 60%, rgba(45,212,191,0.14) 0%, rgba(15,23,42,0.98) 70%)",
        }}
      >
        {/* Grid pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.12]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="bento-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path
                d="M 28 0 L 0 0 0 28"
                fill="none"
                stroke="rgba(45,212,191,0.8)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bento-grid)" />
        </svg>

        {/* Stylised route lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.18]"
          viewBox="0 0 320 208"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M 0 90 Q 90 60 160 110 Q 230 155 320 95"
            fill="none"
            stroke="rgba(45,212,191,0.9)"
            strokeWidth="1.5"
          />
          <path
            d="M 85 0 Q 110 60 130 110 Q 148 155 155 208"
            fill="none"
            stroke="rgba(45,212,191,0.5)"
            strokeWidth="1"
          />
          <path
            d="M 0 155 Q 65 142 130 132 Q 210 120 320 148"
            fill="none"
            stroke="rgba(45,212,191,0.35)"
            strokeWidth="0.8"
          />
        </svg>

        {/* Pulsing marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute h-16 w-16 rounded-full border border-[var(--s-accent)]/25 animate-ping"
              style={{ animationDuration: "2.2s" }}
            />
            <div
              className="absolute h-10 w-10 rounded-full border border-[var(--s-accent)]/45 animate-ping"
              style={{ animationDuration: "2.2s", animationDelay: "0.5s" }}
            />
            <div className="h-5 w-5 rounded-full bg-[var(--s-accent)] border-2 border-white/90 shadow-[0_0_16px_var(--s-accent),0_0_32px_rgba(45,212,191,0.4)]" />
          </div>
        </div>

        {/* Floating landmark pills */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/65 border border-white/12 backdrop-blur-sm px-2.5 py-1">
          <MapPin size={9} className="text-[var(--s-accent)]" />
          <span className="text-xs font-bold text-white">Colosseo · 0.3 km</span>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/65 border border-[var(--s-primary)]/30 backdrop-blur-sm px-2.5 py-1">
          <MapPin size={9} className="text-[var(--s-primary)]" />
          <span className="text-xs font-bold text-white">Pantheon · 0.8 km</span>
        </div>

        {/* Bottom CTA bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 to-transparent">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-accent)] mb-1">
            Mappa Live
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-black text-white leading-tight">
              Esplora i Dintorni
            </p>
            <div className="flex items-center gap-1.5 rounded-full bg-[var(--s-accent)] px-3 py-1.5">
              <Navigation size={11} className="text-slate-900" />
              <span className="text-xs font-black text-slate-900">Inizia</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Safety Tile ───────────────────────────────────────────────────────────────

const SAFETY_CFG: Record<
  SafetyLevel,
  {
    label: string;
    icon: typeof ShieldCheck;
    color: string;
    bg: string;
    border: string;
    glow: string;
    dot: string;
  }
> = {
  STABLE: {
    label: "Stabile",
    icon: ShieldCheck,
    color: "text-teal-400",
    bg: "bg-teal-500/8",
    border: "border-teal-500/25",
    glow: "0 0 20px rgba(20,184,166,0.18)",
    dot: "bg-teal-400",
  },
  WARNING: {
    label: "Attenzione",
    icon: ShieldAlert,
    color: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/25",
    glow: "0 0 20px rgba(245,158,11,0.18)",
    dot: "bg-amber-400",
  },
  CRITICAL: {
    label: "Critico",
    icon: ShieldX,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "0 0 28px rgba(248,113,113,0.30)",
    dot: "bg-red-400",
  },
};

function SafetyTile({ level = "STABLE" }: { level?: SafetyLevel }) {
  const cfg = SAFETY_CFG[level];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "relative h-full rounded-2xl border p-4 flex flex-col justify-between overflow-hidden",
        cfg.bg,
        cfg.border,
      )}
      style={{ boxShadow: cfg.glow }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Shield size={12} className="text-white/35" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
          Sicurezza
        </span>
      </div>

      {/* Status */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon size={18} className={cfg.color} />
          <span className={cn("text-sm font-black", cfg.color)}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse flex-shrink-0", cfg.dot)} />
          <span className="text-[10px] text-white/40">Live · zona attuale</span>
        </div>
      </div>
    </div>
  );
}

// ── Rank Tile ─────────────────────────────────────────────────────────────────

function RankTile({ contestId }: { contestId: string | null }) {
  const { user } = useAuth();
  const { entries } = useLeaderboard(contestId, 200);

  const myEntry = useMemo(
    () => entries.find((e) => e.userId === user?.uid),
    [entries, user?.uid],
  );

  const rank  = myEntry?.rank ?? null;
  const total = entries.length;
  const pct   = rank && total > 1 ? Math.round(((total - rank) / (total - 1)) * 100) : 0;

  return (
    <Link href="/leaderboard" className="block h-full">
      <div className="relative h-full rounded-2xl bg-[var(--s-primary)]/6 border border-[var(--s-primary)]/20 p-4 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <Trophy size={12} className="text-white/35" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
            Classifica
          </span>
        </div>

        {/* Rank */}
        {rank ? (
          <div>
            <p className="text-2xl font-black text-[var(--s-primary)] leading-none">#{rank}</p>
            <p className="text-[10px] text-white/40 mb-2">su {total} giocatori</p>
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.6, duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[var(--s-primary)] to-amber-300"
              />
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={9} className="text-[var(--s-primary)]/60" />
              <span className="text-[10px] text-white/30">Top {100 - pct}%</span>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-2xl font-black text-white/15 leading-none">—</p>
            <p className="text-[10px] text-white/35 mt-1">Inizia a giocare</p>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── AI Tip Tile ───────────────────────────────────────────────────────────────

const TIPS = [
  {
    icon: "🌅",
    tip: "Visita i monumenti all'alba per guadagnare il bonus mattutino ed evitare le folle.",
  },
  {
    icon: "🎯",
    tip: "3 scan al giorno mantengono la streak attiva e moltiplicano i tuoi punti.",
  },
  {
    icon: "📸",
    tip: "Carica foto con buona luce naturale per raccogliere più like nel contest foto.",
  },
  {
    icon: "🔥",
    tip: "7 giorni di streak consecutiva sblocca +150 punti bonus automatici.",
  },
];

function AiTipTile() {
  const tip = TIPS[useMemo(() => Math.floor(Date.now() / 86_400_000) % TIPS.length, [])];

  return (
    <div className="col-span-2 relative rounded-2xl bg-[var(--s-accent-soft)] border border-[var(--s-accent)]/18 p-4 overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 80% 50%, rgba(45,212,191,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{tip.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-[var(--s-accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-accent)]/70">
              Smart Tip · Oggi
            </span>
          </div>
          <p className="text-[13px] text-white/70 leading-relaxed">{tip.tip}</p>
        </div>
      </div>
    </div>
  );
}

// ── BentoHub ──────────────────────────────────────────────────────────────────

interface BentoHubProps {
  safetyLevel?: SafetyLevel;
}

export function BentoHub({ safetyLevel = "STABLE" }: BentoHubProps) {
  const { contest } = useContest();

  return (
    <section className="px-4 mb-8">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-4"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-accent)] mb-0.5">
          Il tuo Hub
        </p>
        <h2 className="font-display text-2xl font-black">Panoramica</h2>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.58, type: "spring", stiffness: 300, damping: 28 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Row 1 — Map (full width) */}
        <MapTile />

        {/* Row 2 — Safety + Rank */}
        <div className="h-36">
          <SafetyTile level={safetyLevel} />
        </div>
        <div className="h-36">
          <RankTile contestId={contest?.id ?? null} />
        </div>

        {/* Row 3 — AI tip (full width) */}
        <AiTipTile />
      </motion.div>
    </section>
  );
}
