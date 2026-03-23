"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useContest } from "@/hooks/useContest";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { CurrencyConverter } from "@/components/features/currency/CurrencyConverter";
import { getWallet } from "@/actions/wallet";
import { getFirebaseClient } from "@/lib/firebase/client";
import { formatCents } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { createOrRenewContest } from "@/actions/contest";
import { useStreak }        from "@/hooks/useStreak";
import { useSubscription }  from "@/hooks/useSubscription";
import { ProBadge }         from "@/components/features/subscription/ProBadge";
import { GoPro }            from "@/components/features/subscription/GoPro";
import type { UserWallet }  from "@/types";
import type { LucideIcon } from "lucide-react";
import {
  User,
  Wallet,
  MapPin,
  Trophy,
  Star,
  Zap,
  Award,
  Crown,
  Shield,
  Flame,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowDownToLine,
  Sparkles,
  Lock,
  LogOut,
  ChevronRight,
  CalendarDays,
  Plus,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Settings,
  Camera,
  Pencil,
  X,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Achievement badge config ──────────────────────────────────────────────

interface Badge {
  id: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  color: string;
  bgColor: string;
  locked: boolean;
}

const BADGES: Badge[] = [
  {
    id: "first_scan",
    icon: Zap,
    label: "Primo Scan",
    desc: "Prima scansione completata",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15 border-yellow-500/25",
    locked: false,
  },
  {
    id: "explorer",
    icon: MapPin,
    label: "Esploratore",
    desc: "5 monumenti visitati",
    color: "text-blue-400",
    bgColor: "bg-blue-500/15 border-blue-500/25",
    locked: false,
  },
  {
    id: "top10",
    icon: Trophy,
    label: "Top 10",
    desc: "Arrivato nella top 10",
    color: "text-purple-400",
    bgColor: "bg-purple-500/15 border-purple-500/25",
    locked: false,
  },
  {
    id: "barcelona_king",
    icon: Crown,
    label: "Barcelona King",
    desc: "10 landmark a Barcellona",
    color: "text-[var(--s-primary)]",
    bgColor: "bg-[var(--s-primary)]/12 border-[var(--s-primary)]/25",
    locked: true,
  },
  {
    id: "streak",
    icon: Flame,
    label: "Fuoco Sacro",
    desc: "7 giorni consecutivi",
    color: "text-orange-400",
    bgColor: "bg-orange-500/15 border-orange-500/25",
    locked: true,
  },
  {
    id: "champion",
    icon: Shield,
    label: "Campione",
    desc: "1° posto in un contest",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15 border-emerald-500/25",
    locked: true,
  },
];

// ── Mock scan history ─────────────────────────────────────────────────────

const MOCK_HISTORY = [
  {
    id: "1",
    landmark: "Sagrada Família",
    city: "Barcellona",
    points: 750,
    image: "https://images.unsplash.com/photo-1583779457094-efcd1a8ca25a?w=120&q=70",
    date: new Date(Date.now() - 1000 * 3600 * 3),
  },
  {
    id: "2",
    landmark: "Park Güell",
    city: "Barcellona",
    points: 500,
    image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=120&q=70",
    date: new Date(Date.now() - 1000 * 3600 * 28),
  },
  {
    id: "3",
    landmark: "Casa Batlló",
    city: "Barcellona",
    points: 620,
    image: "https://images.unsplash.com/photo-1607413386688-b2e3b0a4e8e8?w=120&q=70",
    date: new Date(Date.now() - 1000 * 3600 * 52),
  },
  {
    id: "4",
    landmark: "Colosseo",
    city: "Roma",
    points: 500,
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=120&q=70",
    date: new Date(Date.now() - 1000 * 3600 * 100),
  },
  {
    id: "5",
    landmark: "Torre Eiffel",
    city: "Parigi",
    points: 600,
    image: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=120&q=70",
    date: new Date(Date.now() - 1000 * 3600 * 175),
  },
];

function fmtRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h fa`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}g fa`;
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

// ── Locked state ──────────────────────────────────────────────────────────

function LockedProfile({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="flex flex-col items-center"
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/12 border border-blue-500/22 mb-5"
          style={{ boxShadow: "0 0 40px rgba(59,130,246,0.15)" }}
        >
          <User size={34} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Profilo bloccato</h2>
        <p className="text-sm text-white/45 leading-relaxed max-w-[270px] mb-7">
          Accedi per vedere i tuoi badge, la cronologia scan e il portafoglio premi.
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onSignIn}
          className="flex items-center gap-2 rounded-2xl bg-[var(--s-primary)] px-6 py-3.5 text-sm font-black text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.32)] hover:bg-yellow-300 transition-colors min-h-[48px]"
        >
          <Sparkles size={16} />
          Accedi ora
        </motion.button>
        <div className="mt-8 w-full">
          <p className="text-xs font-bold uppercase tracking-widest text-white/25 mb-4 text-center">
            Strumenti per il viaggiatore
          </p>
          <CurrencyConverter />
        </div>
      </motion.div>
    </div>
  );
}

// ── Compact Wallet Card ───────────────────────────────────────────────────

function WalletCard({ wallet }: { wallet: UserWallet }) {
  const progressPct = Math.min(100, (wallet.balanceCents / 500) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        background: "linear-gradient(140deg,#1b2d4f 0%,#111827 45%,#1a1200 100%)",
        boxShadow:
          "8px 8px 24px rgba(0,0,0,0.6),-4px -4px 14px rgba(255,255,255,0.04)," +
          "inset 0 1px 0 rgba(255,255,255,0.12),inset 0 -1px 0 rgba(0,0,0,0.3)",
      }}
      className="relative overflow-hidden rounded-3xl p-5 border border-white/10"
    >
      <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-[var(--s-primary)]/12 blur-2xl animate-breathe" />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Saldo</p>
          <p className="text-3xl font-black text-white tabular-nums mt-0.5">
            {formatCents(wallet.balanceCents)}
          </p>
        </div>
        <Link
          href="/wallet"
          className="flex items-center gap-1 rounded-xl bg-[var(--s-primary)] px-3 py-2 text-xs font-black text-slate-900 hover:bg-yellow-300 transition-colors min-h-[36px]"
        >
          <ArrowDownToLine size={12} />
          Preleva
          <ChevronRight size={10} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl bg-white/8 border border-white/8 px-3 py-2">
          <p className="text-xs text-white/40 flex items-center gap-1"><TrendingUp size={9}/> Guadagnato</p>
          <p className="text-xs font-black mt-0.5">{formatCents(wallet.totalEarnedCents)}</p>
        </div>
        <div className="rounded-xl bg-white/8 border border-white/8 px-3 py-2">
          <p className="text-xs text-white/40 flex items-center gap-1"><Clock size={9}/> In attesa</p>
          <p className="text-xs font-black mt-0.5">
            {wallet.pendingCents > 0 ? formatCents(wallet.pendingCents) : "—"}
          </p>
        </div>
      </div>
      {wallet.balanceCents < 500 && (
        <div>
          <div className="flex justify-between text-xs text-white/35 mb-1">
            <span>Verso prelievo minimo</span>
            <span>{formatCents(wallet.balanceCents)} / €5</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-[var(--s-primary)]"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Streak card ───────────────────────────────────────────────────────────

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  // Progress toward the next bonus milestone
  const nextMilestone = currentStreak < 3 ? 3 : currentStreak < 7 ? 7 : Math.ceil(currentStreak / 7) * 7;
  const prev          = nextMilestone === 3 ? 0 : nextMilestone === 7 ? 3 : nextMilestone - 7;
  const pct           = Math.min(100, ((currentStreak - prev) / (nextMilestone - prev)) * 100);

  const isOnFire = currentStreak >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-orange-500/8 p-4"
      style={{ boxShadow: isOnFire ? "0 6px 24px rgba(249,115,22,0.18)" : undefined }}
    >
      {/* background glow */}
      {isOnFire && (
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl" />
      )}

      <div className="flex items-center gap-3 mb-3">
        {/* Flame icon — pulses when streak active */}
        <motion.div
          animate={isOnFire ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20"
        >
          <Flame size={20} className="text-orange-400" />
        </motion.div>

        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-white/35">Streak Giornaliero</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-orange-400 tabular-nums">{currentStreak}</span>
            <span className="text-xs text-white/40">
              {currentStreak === 1 ? "giorno" : "giorni"} di fila
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-white/30 font-bold flex items-center gap-0.5 justify-end">
            <CalendarDays size={9} />
            Record
          </p>
          <p className="text-sm font-black text-white/60 tabular-nums">{longestStreak}gg</p>
        </div>
      </div>

      {/* Progress to next bonus */}
      <div className="flex justify-between text-xs text-white/30 mb-1">
        <span className="font-bold">
          {currentStreak < 3
            ? `+50 pt al ${nextMilestone}° giorno`
            : `+150 pt ogni 7 giorni`}
        </span>
        <span>{currentStreak} / {nextMilestone}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/30 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400"
        />
      </div>

      {/* Day dots */}
      <div className="flex gap-1.5 mt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-colors",
              i < (currentStreak % 7 === 0 && currentStreak > 0 ? 7 : currentStreak % 7)
                ? "bg-orange-400"
                : "bg-white/10"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-white/20 mt-1 text-right">prossimo bonus: {nextMilestone}gg</p>
    </motion.div>
  );
}

// ── Achievement grid ──────────────────────────────────────────────────────

function BadgeGrid() {
  return (
    <div className="rounded-2xl bg-white/4 border border-white/8 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Award size={16} className="text-[var(--s-primary)]" />
        <h2 className="text-sm font-black">Traguardi</h2>
        <span className="ml-auto text-xs text-white/30 font-bold">
          {BADGES.filter((b) => !b.locked).length}/{BADGES.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {BADGES.map(({ id, icon: Icon, label, desc, color, bgColor, locked }, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: locked ? 0.4 : 1, scale: 1 }}
            transition={{ delay: 0.05 * i, type: "spring", stiffness: 300, damping: 24 }}
            title={desc}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center",
              bgColor,
              locked && "grayscale"
            )}
          >
            {locked && (
              <Lock size={9} className="absolute top-1.5 right-1.5 text-white/30" />
            )}
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-black/20", color)}>
              <Icon size={18} />
            </div>
            <span className="text-xs font-black text-white leading-tight">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Scan Timeline ─────────────────────────────────────────────────────────

function ScanTimeline() {
  return (
    <div className="rounded-2xl bg-white/4 border border-white/8 p-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={16} className="text-blue-400" />
        <h2 className="text-sm font-black">Cronologia Scan</h2>
      </div>
      <div className="space-y-0">
        {MOCK_HISTORY.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.25 }}
            className="flex items-center gap-3 py-3 border-b border-white/6 last:border-0"
          >
            {/* Thumbnail */}
            <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl">
              <Image
                src={item.image}
                alt={item.landmark}
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>

            {/* Timeline line */}
            <div className="relative flex flex-col items-center self-stretch mr-1">
              <CheckCircle2 size={14} className="text-[var(--s-primary)] flex-shrink-0 mt-1" />
              {i < MOCK_HISTORY.length - 1 && (
                <div className="absolute top-5 bottom-0 w-px bg-white/8" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{item.landmark}</p>
              <p className="text-xs text-white/35">{item.city} · {fmtRelative(item.date)}</p>
            </div>

            {/* Points */}
            <span className="text-sm font-black text-[var(--s-primary)] tabular-nums">+{item.points}pt</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Admin Contest Section ─────────────────────────────────────────────────

function AdminContestSection() {
  const { user } = useAuth();
  const { contest, loading: contestLoading } = useContest();
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [title, setTitle] = useState("");
  const [prizePool, setPrizePool] = useState("350");
  const [durationDays, setDurationDays] = useState("30");

  const isGalleryMode = contest?.id === "general" || !contest;

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    setMessage(null);
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser?.getIdToken();
      if (!tok) throw new Error("Not authenticated");
      const result = await createOrRenewContest(tok, {
        title: title.trim() || undefined,
        prizePool: Math.round(parseFloat(prizePool) * 100),
        durationDays: parseInt(durationDays, 10),
      });
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) setTitle("");
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Errore sconosciuto." });
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="rounded-2xl border border-[var(--s-primary)]/20 bg-[var(--s-primary)]/5 p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--s-primary)]/15 border border-[var(--s-primary)]/25">
          <Settings size={15} className="text-[var(--s-primary)]" />
        </div>
        <div>
          <p className="text-sm font-black text-[var(--s-primary)]">Pannello Admin</p>
          <p className="text-xs text-white/35">Gestione contest fotografici</p>
        </div>
      </div>

      {/* Current contest status */}
      <div className="rounded-xl bg-white/[0.04] border border-white/8 p-3">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Contest attuale</p>
        {contestLoading ? (
          <Loader2 className="animate-spin text-white/40" size={16} />
        ) : isGalleryMode ? (
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300">Nessun contest attivo — modalità gallery.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="font-bold text-xs text-white">{contest?.title}</p>
            <p className="text-xs text-white/40">
              Premio: {formatCents(contest?.prizePool ?? 0)} · Scade:{" "}
              {contest?.endDate ? new Date(contest.endDate).toLocaleDateString("it-IT") : "—"}
            </p>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">✓ Attivo</p>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Titolo (opzionale)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Contest ${new Date().toLocaleString("it-IT", { month: "long", year: "numeric" })}`}
            className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[var(--s-primary)]/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Premio (€)</label>
            <input
              type="number"
              value={prizePool}
              onChange={(e) => setPrizePool(e.target.value)}
              min="0"
              step="10"
              className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--s-primary)]/40"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Durata (giorni)</label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              min="1"
              max="365"
              className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--s-primary)]/40"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs ${
          message.type === "success"
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
            : "bg-red-500/10 border border-red-500/20 text-red-300"
        }`}>
          {message.type === "success"
            ? <CheckCircle2 size={13} className="flex-shrink-0" />
            : <AlertTriangle size={13} className="flex-shrink-0" />}
          {message.text}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--s-primary)] py-3 text-sm font-black text-slate-900 shadow-[0_4px_16px_rgba(255,215,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating
          ? <Loader2 size={15} className="animate-spin" />
          : isGalleryMode
          ? <><Plus size={15} />Crea contest</>
          : <><RefreshCw size={15} />Rinnova contest</>}
      </button>
    </motion.div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────

export function ProfileView() {
  const { user, loading: authLoading, logout, updateUserProfile } = useAuth();
  const { contest }                  = useContest();
  const { currentStreak, longestStreak } = useStreak();
  const { isPro }                    = useSubscription();
  const [authOpen, setAuthOpen]   = useState(false);
  const [wallet, setWallet]       = useState<UserWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [isAdmin, setIsAdmin]     = useState(false);

  // Profile edit state
  const [editMode, setEditMode]       = useState(false);
  const [editName, setEditName]       = useState("");
  const [editFile, setEditFile]       = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setEditName(user?.displayName ?? "");
    setEditFile(null);
    setEditPreview(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditPreview(null);
    setEditFile(null);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditFile(file);
    setEditPreview(URL.createObjectURL(file));
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ displayName: editName, photoFile: editFile ?? undefined });
      setEditMode(false);
      setEditPreview(null);
      setEditFile(null);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user) { setWalletLoading(false); return; }
    (async () => {
      try {
        const { auth, db } = getFirebaseClient();
        const [tok, snap] = await Promise.all([
          auth.currentUser!.getIdToken(),
          getDoc(doc(db, "users", user.uid)),
        ]);
        const w = await getWallet(tok);
        setWallet(w);
        setIsAdmin(!!snap.data()?.isAdmin);
      } finally {
        setWalletLoading(false);
      }
    })();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-white/15 border-t-[var(--s-primary)] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-slate-950 text-white pb-24">
          <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-950/95 px-4 pt-header pb-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <User className="text-blue-400" size={22} />
              <h1 className="text-xl font-black">Profilo</h1>
            </div>
          </div>
          <LockedProfile onSignIn={() => setAuthOpen(true)} />
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-950/95 px-4 pt-header pb-4 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="text-blue-400" size={22} />
          <h1 className="text-xl font-black">Profilo</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/wallet"
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/6 hover:bg-white/10 transition-colors"
            title="Portafoglio"
          >
            <Wallet size={15} className="text-white/50" />
          </Link>
          <button
            onClick={logout}
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/6 hover:bg-white/10 transition-colors"
            title="Esci"
          >
            <LogOut size={14} className="text-white/50" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* User Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="flex items-center gap-4 rounded-2xl bg-white/4 border border-white/8 p-4"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
            {editMode ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-[var(--s-primary)]/60 focus:outline-none"
              >
                {editPreview || user.photoURL ? (
                  <Image
                    src={editPreview ?? user.photoURL!}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                    <User size={28} className="text-white/60" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Camera size={20} className="text-white" />
                </div>
              </button>
            ) : (
              <>
                {user.photoURL ? (
                  <div className="h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-[var(--s-primary)]/50">
                    <Image
                      src={user.photoURL}
                      alt={user.displayName ?? "Avatar"}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center">
                    <User size={28} className="text-white/60" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--s-primary)] border border-slate-950">
                  <Star size={10} className="text-slate-900" fill="currentColor" />
                </div>
              </>
            )}
          </div>

          {/* Info / Edit form */}
          <div className="flex-1 min-w-0">
            {editMode ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Il tuo nickname"
                  maxLength={30}
                  className="w-full rounded-xl bg-white/8 border border-white/15 px-3 py-2 text-sm font-bold text-white placeholder-white/30 focus:outline-none focus:border-[var(--s-primary)]/60"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving || !editName.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--s-primary)] px-3 py-1.5 text-xs font-black text-slate-900 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Salva
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl bg-white/8 px-3 py-1.5 text-xs font-bold text-white/70"
                  >
                    <X size={12} />
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-lg font-black truncate">{user.displayName ?? "Esploratore"}</p>
                  {isPro && <ProBadge size="sm" />}
                  <button
                    onClick={startEdit}
                    className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg bg-white/6 hover:bg-white/12 transition-colors flex-shrink-0"
                    title="Modifica profilo"
                  >
                    <Pencil size={11} className="text-white/50" />
                  </button>
                </div>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
                {contest && (
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--s-primary)]/12 border border-[var(--s-primary)]/20 px-2 py-0.5">
                    <Trophy size={9} className="text-[var(--s-primary)]" />
                    <span className="text-xs font-black text-[var(--s-primary)]">
                      {formatCents(contest.prizePool)} in palio
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Admin Section */}
        {isAdmin && <AdminContestSection />}

        {/* Wallet Card */}
        {walletLoading ? (
          <div className="rounded-3xl bg-white/4 border border-white/8 h-32 animate-pulse" />
        ) : wallet ? (
          <WalletCard wallet={wallet} />
        ) : (
          <div className="rounded-2xl bg-white/4 border border-white/8 p-4 flex items-center gap-3">
            <Wallet size={18} className="text-[var(--s-primary)]/50" />
            <p className="text-sm text-white/40">Portafoglio non disponibile</p>
            <Link href="/wallet" className="ml-auto text-xs text-blue-400 underline">Apri</Link>
          </div>
        )}

        {/* Pro subscription card */}
        <GoPro variant="compact" />

        {/* Streak Card */}
        <StreakCard currentStreak={currentStreak} longestStreak={longestStreak} />

        {/* Badge Grid */}
        <BadgeGrid />

        {/* Scan Timeline */}
        <ScanTimeline />

        {/* Currency Converter */}
        <div>
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">Strumenti viaggiatore</p>
          </div>
          <CurrencyConverter />
        </div>

      </div>
    </div>
  );
}
