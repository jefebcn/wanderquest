"use client";

/**
 * BentoHub — 2026 Panoramica Hub.
 *
 * Layout (mobile-first):
 *  ┌───────────────────────────────────────┐
 *  │  [KPI strip — points + streak]  (auth)│  row 0
 *  ├───────────────────────────────────────┤
 *  │  MAP TILE — interactive landmark pins │  row 1 (tall)
 *  ├──────────────────┬────────────────────┤
 *  │  Safety + 1-line │  Live Mini Podium  │  row 2 (medium)
 *  ├──────────────────┴────────────────────┤
 *  │  Social Community Feed       (2col)   │  row 3 (compact)
 *  └───────────────────────────────────────┘
 */

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
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
  Heart,
  Crown,
  Luggage,
} from "lucide-react";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { getFirebaseClient }   from "@/lib/firebase/client";
import { useAuth }             from "@/hooks/useAuth";
import { useContest }          from "@/hooks/useContest";
import { useLeaderboard }      from "@/hooks/useLeaderboard";
import { getNearbyLandmarks }  from "@/actions/landmarks";
import { cn }                  from "@/lib/utils";
import type { SafetyLevel }    from "@/types";

// ── KPI Strip ────────────────────────────────────────────────────────────────

function KpiStrip({ uid }: { uid: string }) {
  const [pts, setPts]       = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const { db } = getFirebaseClient();
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setPts(snap.data().totalPoints as number ?? 0);
          setStreak(snap.data().currentStreak as number ?? 0);
        }
      } catch { /* non-fatal */ }
    })();
  }, [uid]);

  if (pts === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="flex items-center gap-2 mb-4"
    >
      <div className="flex items-center gap-1.5 rounded-full bg-[var(--s-primary)]/10 border border-[var(--s-primary)]/20 px-3 py-1.5">
        <span className="text-sm">🏆</span>
        <span className="text-xs font-black text-[var(--s-primary)] text-mono-data">{pts.toLocaleString("it-IT")} pt</span>
      </div>
      {streak !== null && streak > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1.5">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-black text-orange-400">{streak}g streak</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Map Tile ──────────────────────────────────────────────────────────────────

function MapTile() {
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);

  // Non-intrusively check if geolocation permission was already granted.
  // If so, silently fetch nearby landmark count to show a live number.
  const loadNearbyCount = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    try {
      const perm = await navigator.permissions.query({ name: "geolocation" });
      if (perm.state !== "granted") return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { landmarks } = await getNearbyLandmarks(
              pos.coords.latitude,
              pos.coords.longitude,
              5000
            );
            setNearbyCount(landmarks.length);
          } catch { /* non-fatal */ }
        },
        () => { /* error or permission revoked — keep static label */ },
        { maximumAge: 30_000, timeout: 8_000, enableHighAccuracy: false }
      );
    } catch { /* permissions API not supported in this browser */ }
  }, []);

  useEffect(() => { loadNearbyCount(); }, [loadNearbyCount]);

  const subtitleLabel = nearbyCount !== null
    ? nearbyCount === 1
      ? "Mappa Live · 1 Monumento Vicino"
      : `Mappa Live · ${nearbyCount} Monumenti Vicini`
    : "Mappa Live · Esplora i Dintorni";

  return (
    <Link href="/explore" className="block col-span-2" aria-label="Apri mappa esplorativa">
      <div
        className="relative h-52 rounded-2xl overflow-hidden border border-white/8 cursor-pointer glass-card-hover bg-[#0c1524]"
      >
        {/* Dot-matrix background pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="bento-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(45,212,191,0.7)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bento-dots)" />
        </svg>

        {/* Subtle radial glow around center */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 52%, rgba(45,212,191,0.1) 0%, transparent 65%)" }} />

        {/* Pulsing GPS marker — user position (centered as visual anchor) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 rounded-full border border-[var(--s-accent)]/25 animate-ping" style={{ animationDuration: "2.2s" }} />
            <div className="absolute h-10 w-10 rounded-full border border-[var(--s-accent)]/45 animate-ping" style={{ animationDuration: "2.2s", animationDelay: "0.5s" }} />
            <div className="size-5 rounded-full bg-[var(--s-accent)] border-2 border-white/90 shadow-[0_0_16px_var(--s-accent),0_0_32px_rgba(45,212,191,0.4)]" />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 to-transparent">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-accent)] mb-1">
            {subtitleLabel}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-black text-white leading-tight">Esplora i Dintorni</p>
            <div className="flex items-center gap-1.5 rounded-full bg-[var(--s-accent)] px-3 py-1.5">
              <Navigation size={11} strokeWidth={2} className="text-slate-900" aria-hidden="true" />
              <span className="text-xs font-black text-slate-900">Inizia</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Safety Tile (compact + Haiku 1-sentence) ──────────────────────────────────

const SAFETY_CFG: Record<SafetyLevel, {
  label: string;
  summary: string;
  icon: typeof ShieldCheck;
  color: string;
  bg: string;
  border: string;
  glow: string;
  dot: string;
}> = {
  STABLE: {
    label:   "Stabile",
    summary: "Area sicura — esplora con le normali precauzioni del viaggiatore.",
    icon:    ShieldCheck,
    color:   "text-teal-400",
    bg:      "bg-teal-500/8",
    border:  "border-teal-500/25",
    glow:    "0 0 20px rgba(20,184,166,0.18)",
    dot:     "bg-teal-400",
  },
  WARNING: {
    label:   "Attenzione",
    summary: "Evita zone isolate di notte; monitora gli avvisi locali.",
    icon:    ShieldAlert,
    color:   "text-amber-400",
    bg:      "bg-amber-500/8",
    border:  "border-amber-500/25",
    glow:    "0 0 20px rgba(245,158,11,0.22)",
    dot:     "bg-amber-400",
  },
  CRITICAL: {
    label:   "Critico",
    summary: "Segui le istruzioni delle autorità e limita gli spostamenti.",
    icon:    ShieldX,
    color:   "text-red-400",
    bg:      "bg-red-500/10",
    border:  "border-red-500/30",
    glow:    "0 0 28px rgba(248,113,113,0.35)",
    dot:     "bg-red-400",
  },
};

function SafetyTile({ level = "STABLE" }: { level?: SafetyLevel }) {
  const cfg  = SAFETY_CFG[level];
  const Icon = cfg.icon;

  return (
    <div
      aria-label="Stato sicurezza"
      className={cn("relative h-full rounded-2xl border p-4 flex flex-col justify-between overflow-hidden", cfg.bg, cfg.border)}
      style={{ boxShadow: cfg.glow }}
    >
      <div className="flex items-center gap-1.5">
        <Shield size={12} strokeWidth={1.8} className="text-white/35" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Sicurezza</span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon size={18} strokeWidth={1.8} className={cfg.color} />
          <span className={cn("text-sm font-black", cfg.color)}>{cfg.label}</span>
        </div>
        {/* Haiku-style 1-sentence advisory */}
        <p className="text-[11px] text-white/50 leading-snug mb-2">{cfg.summary}</p>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse flex-shrink-0", cfg.dot)} />
          <span className="text-[10px] text-white/40">Live · zona attuale</span>
        </div>
      </div>
    </div>
  );
}

// ── Live Mini Podium Tile ─────────────────────────────────────────────────────

const MEDAL = ["🥇", "🥈", "🥉"] as const;

function LivePodiumTile({ contestId }: { contestId: string | null }) {
  const { user }    = useAuth();
  const { entries } = useLeaderboard(contestId, 10);

  const top3    = useMemo(() => entries.slice(0, 3), [entries]);
  const myEntry = useMemo(() => entries.find((e) => e.userId === user?.uid), [entries, user?.uid]);
  const top10Threshold = entries[9]?.points ?? null;
  const ptsDiff = top10Threshold !== null && myEntry && myEntry.rank > 10
    ? top10Threshold - myEntry.points
    : null;
  const progressPct = top10Threshold && myEntry
    ? Math.min(Math.round((myEntry.points / top10Threshold) * 100), 100)
    : 0;

  return (
    <Link href="/leaderboard" className="block h-full" aria-label="Vai alla classifica">
      <div className="relative h-full rounded-2xl bg-[var(--s-primary)]/6 border border-[var(--s-primary)]/20 p-3 flex flex-col justify-between overflow-hidden glass-card-hover">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <Trophy size={12} strokeWidth={1.8} className="text-[var(--s-primary)]/60" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Classifica Live</span>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>

        {/* Top-3 rows */}
        {top3.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-white/30 text-center">Ancora nessun esploratore — inizia tu!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 flex-1">
            {top3.map((entry, i) => {
              const isMe = entry.userId === user?.uid;
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-2 py-1",
                    isMe ? "bg-[var(--s-primary)]/12" : i === 0 ? "bg-white/4" : ""
                  )}
                >
                  {/* Medal / rank */}
                  <span className="text-[13px] flex-shrink-0 leading-none">{MEDAL[i]}</span>

                  {/* Avatar */}
                  <div className="relative size-5 flex-shrink-0 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                    {entry.photoURL ? (
                      <Image src={entry.photoURL} alt={entry.displayName} fill className="object-cover" sizes="20px" />
                    ) : (
                      <span className="text-[7px] font-black text-white/70">
                        {entry.displayName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <p className={cn(
                    "text-[11px] font-bold truncate flex-1 min-w-0",
                    isMe ? "text-[var(--s-primary)]" : "text-white/80",
                    i === 0 ? "font-black" : ""
                  )}>
                    {entry.displayName}
                    {isMe && <span className="text-[9px] font-normal opacity-50 ml-0.5">(tu)</span>}
                  </p>

                  {/* Points */}
                  <span className={cn(
                    "text-[11px] font-black flex-shrink-0 text-mono-data",
                    i === 0 ? "text-[var(--s-primary)]" : "text-white/50"
                  )}>
                    {entry.points.toLocaleString("it-IT")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* "X pt per Top 10" progress — shown for unranked / rank > 10 users */}
        {ptsDiff !== null && ptsDiff > 0 && (
          <div className="mt-2 pt-2 border-t border-white/6">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={9} strokeWidth={1.8} className="text-[var(--s-primary)]/60" aria-hidden="true" />
              <span className="text-[10px] text-white/35">
                <span className="text-[var(--s-primary)]/80 font-black">{ptsDiff.toLocaleString("it-IT")} pt</span> per Top 10
              </span>
            </div>
            <div className="h-0.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--s-primary)] to-amber-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Crown icon bg decoration */}
        <Crown
          size={52}
          className="absolute -bottom-2 -right-2 text-[var(--s-primary)]/5"
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

// ── Community Feed Tile ───────────────────────────────────────────────────────

interface CommunityPhoto {
  id: string;
  imageUrl: string;
  city?: string;
  displayName?: string;
  avatarGradient?: string;
  likes: number;
  superLikes: number;
  uploadedAt?: string;
}

const FALLBACK_TIPS = [
  { icon: "🌅", tip: "Visita i monumenti all'alba per guadagnare il bonus mattutino." },
  { icon: "🎯", tip: "3 scan al giorno mantengono la streak e moltiplicano i tuoi punti." },
  { icon: "📸", tip: "Foto con buona luce naturale raccolgono più like nel contest." },
  { icon: "🔥", tip: "7 giorni di streak consecutiva sblocca +150 punti bonus." },
];

const AVATAR_GRADIENTS = [
  "from-purple-500 to-pink-500",
  "from-teal-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-blue-500 to-indigo-500",
];

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 60000; // minutes
  if (diff < 2)   return "ora";
  if (diff < 60)  return `${Math.round(diff)}min fa`;
  if (diff < 1440) return `${Math.round(diff / 60)}h fa`;
  return `${Math.round(diff / 1440)}g fa`;
}

function isLive(iso?: string): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 3_600_000; // < 1h
}

function CommunityFeedTile({ contestId }: { contestId: string | null }) {
  const [photos, setPhotos]   = useState<CommunityPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId) { setLoading(false); return; }
    (async () => {
      try {
        const { db } = getFirebaseClient();
        const snap = await getDocs(
          query(
            collection(db, "contest_photos"),
            where("contestId", "==", contestId),
            where("status", "in", ["approved", "active", "published"]),
            limit(5),
          )
        );
        setPhotos(snap.docs.map((d, i) => ({
          id:            d.id,
          imageUrl:      d.data().imageUrl as string,
          city:          d.data().city as string | undefined,
          displayName:   d.data().displayName as string | undefined,
          avatarGradient: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
          likes:         (d.data().likes as number) ?? 0,
          superLikes:    (d.data().superLikes as number) ?? 0,
          uploadedAt:    d.data().uploadedAt as string | undefined,
        })));
      } catch { /* non-fatal */ } finally {
        setLoading(false);
      }
    })();
  }, [contestId]);

  const hour   = new Date().getHours();
  const tipCtx = hour < 10 ? 0 : hour < 14 ? 1 : hour < 19 ? 2 : 3;
  const tip    = FALLBACK_TIPS[tipCtx];

  // Fallback: time-of-day AI tip
  if (!loading && photos.length === 0) {
    return (
      <div className="col-span-2 relative rounded-2xl bg-[var(--s-accent-soft)] border border-[var(--s-accent)]/18 p-4 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(45,212,191,0.12) 0%, transparent 70%)" }} />
        <div className="relative z-10 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{tip.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={11} strokeWidth={1.8} className="text-[var(--s-accent)]" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-accent)]/70">Smart Tip · Oggi</span>
            </div>
            <p className="text-body-md text-[13px] text-white/70 leading-relaxed">{tip.tip}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-2 rounded-2xl bg-white/[0.04] border border-white/8 p-3.5">
      <div className="flex items-center gap-1.5 mb-3">
        <Heart size={12} strokeWidth={1.8} className="text-[var(--s-energy)]" fill="currentColor" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Live dal contest</span>
        <Link href="/scan" className="ml-auto text-[10px] font-bold text-[var(--s-accent)]">
          Vedi tutte →
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 aspect-[2/3] rounded-xl bg-white/[0.05] animate-glass-shimmer" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
          {photos.map((photo, i) => {
            const live  = isLive(photo.uploadedAt);
            const ago   = timeAgo(photo.uploadedAt);
            const initials = (photo.displayName ?? "??").slice(0, 2).toUpperCase();

            return (
              <div
                key={photo.id}
                className="relative flex-shrink-0 w-[44%] aspect-[2/3] rounded-xl overflow-hidden snap-start"
              >
                <Image
                  src={photo.imageUrl}
                  alt={photo.city ?? "Foto contest"}
                  fill
                  className="object-cover"
                  sizes="44vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* User avatar top-left */}
                <div
                  className={cn(
                    "absolute top-1.5 left-1.5 size-6 rounded-full flex items-center justify-center text-[8px] font-black text-white border border-white/20 bg-gradient-to-br",
                    photo.avatarGradient ?? "from-slate-500 to-slate-700"
                  )}
                >
                  {initials}
                </div>

                {/* Live badge top-right */}
                {live && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-black/60 border border-green-500/40 px-1.5 py-0.5 backdrop-blur-sm">
                    <span className="h-1 w-1 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                    <span className="text-[8px] font-black text-green-400">LIVE</span>
                  </div>
                )}

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  {photo.city && (
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <MapPin size={7} className="text-white/50" aria-hidden="true" />
                      <span className="text-[9px] text-white/60 font-bold truncate">{photo.city}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <Heart size={8} className="text-rose-400" fill="currentColor" />
                      <span className="text-[9px] font-black text-white">{photo.likes + photo.superLikes * 3}</span>
                    </div>
                    {ago && (
                      <span className="text-[8px] text-white/40">{ago}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Packing Tile ──────────────────────────────────────────────────────────────

interface PackingTileData {
  destination: string;
  checkedCount: number;
  totalCount: number;
}

function PackingTile({ uid }: { uid: string }) {
  const [data, setData] = useState<PackingTileData | null>(null);

  useEffect(() => {
    const { db } = getFirebaseClient();
    const unsubscribe = onSnapshot(
      doc(db, "packing_lists", uid),
      (snap) => {
        if (!snap.exists()) { setData(null); return; }
        const d = snap.data() as {
          destination?: string;
          items?: Array<{ checked?: boolean }>;
        };
        const items = d.items ?? [];
        setData({
          destination: d.destination ?? "—",
          checkedCount: items.filter((i) => i.checked).length,
          totalCount: items.length,
        });
      },
      () => setData(null)
    );
    return () => unsubscribe();
  }, [uid]);

  if (!data || data.totalCount === 0) return null;

  const pct = Math.round((data.checkedCount / data.totalCount) * 100);

  return (
    <div className="col-span-2 rounded-2xl bg-white/[0.04] border border-white/8 p-3.5 flex items-center gap-3">
      <div className="size-9 flex-shrink-0 rounded-xl bg-[var(--s-accent)]/10 border border-[var(--s-accent)]/20 flex items-center justify-center">
        <Luggage size={18} className="text-[var(--s-accent)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-accent)]/70">Prossimo Viaggio</p>
            <p className="text-[13px] font-black text-white leading-tight truncate">{data.destination}</p>
          </div>
          <span className="text-[18px] font-black text-[var(--s-accent)] font-mono flex-shrink-0 ml-2">{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/6 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--s-accent)] to-[var(--s-primary)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[9px] text-white/30 mt-0.5">{data.checkedCount}/{data.totalCount} articoli pronti</p>
      </div>
    </div>
  );
}

// ── BentoHub ──────────────────────────────────────────────────────────────────

interface BentoHubProps {
  safetyLevel?: SafetyLevel;
}

export function BentoHub({ safetyLevel = "STABLE" }: BentoHubProps) {
  const { user }    = useAuth();
  const { contest } = useContest();

  return (
    <section className="px-4 mb-8">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-3"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-accent)] mb-0.5">Il tuo Hub</p>
        <h2 className="font-display text-title-lg font-black">Panoramica</h2>
      </motion.div>

      {/* KPI strip for authenticated users */}
      {user && <KpiStrip uid={user.uid} />}

      {/* Bento grid */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.58, type: "spring", stiffness: 300, damping: 28 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Row 1 — Map (full width, tall) */}
        <MapTile />

        {/* Row 2 — Safety + Live Podium */}
        <div className="h-44">
          <SafetyTile level={safetyLevel} />
        </div>
        <div className="h-44">
          <LivePodiumTile contestId={contest?.id ?? null} />
        </div>

        {/* Row 3 — Community social feed (full width) */}
        <CommunityFeedTile contestId={contest?.id ?? null} />

        {/* Row 4 — Packing progress tile (only when user has an active list) */}
        {user && <PackingTile uid={user.uid} />}
      </motion.div>
    </section>
  );
}
