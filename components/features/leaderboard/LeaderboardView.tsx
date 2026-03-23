"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useContest }     from "@/hooks/useContest";
import { useAuth }        from "@/hooks/useAuth";
import { useSeason }      from "@/hooks/useSeason";
import { AuthModal }      from "@/components/features/auth/AuthModal";
import { LeaderboardSkeleton } from "@/components/ui/Skeleton";
import { SeasonBanner, LeagueStripOverview } from "@/components/features/league/SeasonBanner";
import { formatCents }    from "@/lib/utils";
import { LEAGUE_CONFIGS, getLeagueConfig } from "@/lib/leagues";
import { Crown, Trophy, Clock, Coins, Star, Lock, Sparkles, Heart, MapPin, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ProBadge } from "@/components/features/subscription/ProBadge";
import type { LeaderboardEntry, SeasonStandingEntry, LeagueId } from "@/types";

// ── Mock photo leaderboard ────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-green-500 to-emerald-500",
  "from-red-500 to-rose-500",
  "from-indigo-500 to-blue-500",
];

interface PhotoRankEntry {
  rank: number;
  userId: string;
  displayName: string;
  initials: string;
  avatarGradient: string;
  votePoints: number;
  photoCount: number;
  topPhoto?: string;
  city?: string;
}

const MOCK_PHOTO_RANKINGS: PhotoRankEntry[] = [
  { rank: 1, userId: "u5", displayName: "Elena López",   initials: "EL", avatarGradient: AVATAR_GRADIENTS[4], votePoints: 611, photoCount: 3, topPhoto: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=120&q=70", city: "Parigi" },
  { rank: 2, userId: "u3", displayName: "Lucia García",  initials: "LG", avatarGradient: AVATAR_GRADIENTS[2], votePoints: 546, photoCount: 2, topPhoto: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=120&q=70", city: "Barcellona" },
  { rank: 3, userId: "u1", displayName: "Sofia Rossi",   initials: "SR", avatarGradient: AVATAR_GRADIENTS[0], votePoints: 369, photoCount: 4, topPhoto: "https://images.unsplash.com/photo-1583779457094-efcd1a8ca25a?w=120&q=70", city: "Barcellona" },
  { rank: 4, userId: "u2", displayName: "Marco Bianchi", initials: "MB", avatarGradient: AVATAR_GRADIENTS[1], votePoints: 282, photoCount: 2, topPhoto: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=120&q=70", city: "Barcellona" },
  { rank: 5, userId: "u4", displayName: "Luca Ferrari",  initials: "LF", avatarGradient: AVATAR_GRADIENTS[3], votePoints: 214, photoCount: 1, topPhoto: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=120&q=70", city: "Roma" },
  { rank: 6, userId: "u6", displayName: "Filippo Conte", initials: "FC", avatarGradient: AVATAR_GRADIENTS[5], votePoints: 140, photoCount: 2, topPhoto: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=120&q=70", city: "Roma" },
];

// ── Photo Leaderboard Row ─────────────────────────────────────────────────

function PhotoRankRow({ entry, isMe, index }: { entry: PhotoRankEntry; isMe: boolean; index: number }) {
  const isTop3 = entry.rank <= 3;
  const medalColors: Record<number, string> = { 1: "text-[var(--s-primary)]", 2: "text-slate-300", 3: "text-amber-600" };
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 + index * 0.04 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl p-3",
        isMe  ? "bg-[var(--s-primary)]/8 border border-[var(--s-primary)]/22" :
        isTop3 ? "bg-[var(--s-primary)]/4 border border-[var(--s-primary)]/10" :
                 "bg-white/4 border border-transparent"
      )}
    >
      {/* Rank */}
      <span className={cn(
        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black",
        isTop3 ? (medalColors[entry.rank] ?? "text-white/45") : "bg-white/8 text-white/45"
      )}>
        {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : entry.rank}
      </span>

      {/* Avatar */}
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white",
          `bg-gradient-to-br ${entry.avatarGradient}`,
        )}
      >
        {entry.initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold truncate", isMe && "text-[var(--s-primary)]")}>
          {entry.displayName}
          {isMe && <span className="ml-1.5 text-xs font-normal opacity-60">(tu)</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-white/35">
          {entry.city && <span className="flex items-center gap-0.5"><MapPin size={8}/>{entry.city}</span>}
          <span>{entry.photoCount} foto</span>
        </div>
      </div>

      {/* Top photo thumbnail */}
      {entry.topPhoto && (
        <div className="relative h-10 w-10 flex-shrink-0 rounded-xl overflow-hidden">
          <Image src={entry.topPhoto} alt="top" fill className="object-cover" sizes="40px" />
        </div>
      )}

      {/* Vote points */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black tabular-nums">{entry.votePoints.toLocaleString("it-IT")}</p>
        {isTop3 ? (
          <p className="text-xs font-black text-[var(--s-primary)]/70 flex items-center gap-0.5">
            <Heart size={8} fill="currentColor"/>voti
          </p>
        ) : (
          <p className="text-xs text-white/30">voti</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Podium place ──────────────────────────────────────────────────────────

function PodiumPlace({
  entry,
  rank,
  isMe,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  isMe: boolean;
}) {
  const cfg = {
    1: {
      blockH: "h-20", order: "order-2", textColor: "text-[var(--s-primary)]",
      blockGrad: "from-[var(--s-primary)]/25 to-transparent border-[var(--s-primary)]/35",
      avatarSize: "h-16 w-16",
      // Outer glow ring via boxShadow — can't do dynamic colours in Tailwind JIT
      avatarGlow: "0 0 0 3px var(--s-primary), 0 0 20px rgba(255,215,0,0.7), 0 0 48px rgba(255,215,0,0.3)",
    },
    2: {
      blockH: "h-14", order: "order-1", textColor: "text-slate-300",
      blockGrad: "from-slate-400/15 to-transparent border-slate-400/25",
      avatarSize: "h-12 w-12",
      avatarGlow: "0 0 0 3px #9ca3af, 0 0 14px rgba(156,163,175,0.65), 0 0 32px rgba(156,163,175,0.25)",
    },
    3: {
      blockH: "h-10", order: "order-3", textColor: "text-amber-600",
      blockGrad: "from-amber-700/15 to-transparent border-amber-700/25",
      avatarSize: "h-12 w-12",
      avatarGlow: "0 0 0 3px #b45309, 0 0 14px rgba(180,83,9,0.6), 0 0 30px rgba(180,83,9,0.25)",
    },
  }[rank];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.07, type: "spring", stiffness: 300, damping: 26 }}
      className={cn("flex flex-col items-center gap-1.5 flex-1", cfg.order)}
    >
      {rank === 1 && (
        <Crown size={22} className="text-[var(--s-primary)] drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]" />
      )}
      {rank !== 1 && <div className="h-5" />}

      {/* Avatar with rank-colored glowing ring */}
      <motion.div
        animate={rank === 1 ? { scale: [1, 1.04, 1] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className={cn("relative rounded-full overflow-hidden flex items-center justify-center bg-slate-800", cfg.avatarSize)}
        style={{ boxShadow: cfg.avatarGlow }}
      >
        {entry.photoURL ? (
          <Image src={entry.photoURL} alt={entry.displayName} fill className="object-cover" sizes="64px" />
        ) : (
          <span className={cn("text-sm font-black", cfg.textColor)}>
            {entry.displayName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </motion.div>

      <p className={cn("text-xs font-black text-center truncate max-w-[72px]", isMe ? "text-[var(--s-primary)]" : "text-white")}>
        {entry.displayName}
      </p>
      <p className={cn("text-xs font-bold", cfg.textColor)}>
        {entry.points.toLocaleString("it-IT")} pt
      </p>
      {/* PRO badge on top-3 podium entries when applicable */}
      {(entry as LeaderboardEntry & { isPro?: boolean }).isPro && (
        <ProBadge size="xs" animate={false} />
      )}

      {/* Podium block */}
      <div className={cn("w-full rounded-t-2xl bg-gradient-to-b border", cfg.blockH, cfg.blockGrad)} />
    </motion.div>
  );
}

// ── Row rank 4+ ───────────────────────────────────────────────────────────

function LeaderboardRow({ entry, isMe, index }: { entry: LeaderboardEntry; isMe: boolean; index: number }) {
  const isTop10 = entry.rank <= 10;
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 + index * 0.035, duration: 0.28 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl p-3",
        isMe
          ? "bg-[var(--s-primary)]/8 border border-[var(--s-primary)]/22"
          : isTop10
            ? "bg-[var(--s-primary)]/4 border border-[var(--s-primary)]/10"
            : "bg-white/4 border border-transparent"
      )}
      style={isTop10 && !isMe ? { boxShadow: "0 2px 16px rgba(255,215,0,0.07)" } : undefined}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-xs font-black text-white/45 flex-shrink-0">
        {entry.rank}
      </span>
      <div className="relative h-9 w-9 flex-shrink-0 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
        {entry.photoURL ? (
          <Image src={entry.photoURL} alt={entry.displayName} fill className="object-cover" sizes="36px" />
        ) : (
          <span className="text-xs font-black text-white/60">{entry.displayName.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("text-sm font-bold truncate", isMe && "text-[var(--s-primary)]")}>
            {entry.displayName}
            {isMe && <span className="ml-1.5 text-xs font-normal opacity-60">(tu)</span>}
          </p>
        </div>
        <p className="text-xs text-white/35">{entry.visits} visite</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black">{entry.points.toLocaleString("it-IT")}</p>
        {isTop10 ? (
          <p className="text-xs font-black text-[var(--s-primary)]/70 uppercase tracking-wide">Rank Up ↑</p>
        ) : (
          <p className="text-xs text-white/30">pt</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Locked state ──────────────────────────────────────────────────────────

function LockedLeaderboard({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="flex flex-col items-center"
      >
        {/* Lock icon with glow */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--s-primary)]/10 border border-[var(--s-primary)]/22 mb-5"
          style={{ boxShadow: "0 0 40px rgba(255,215,0,0.18)" }}
        >
          <Lock size={34} className="text-[var(--s-primary)]" />
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-[var(--s-primary)]/10 border border-[var(--s-primary)]/20 px-3 py-1 mb-4">
          <Sparkles size={11} className="text-[var(--s-primary)]" />
          <span className="text-xs font-black text-[var(--s-primary)]">Contenuto esclusivo</span>
        </div>

        <h2 className="text-2xl font-black text-white mb-2">Classifica bloccata</h2>
        <p className="text-sm text-white/45 leading-relaxed max-w-[260px] mb-7">
          Accedi per vedere chi sta vincendo il montepremi e sfidare gli altri esploratori.
        </p>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onSignIn}
          className="flex items-center gap-2 rounded-2xl bg-[var(--s-primary)] px-6 py-3.5 text-sm font-black text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.35)] hover:bg-yellow-300 transition-colors min-h-[48px]"
        >
          <Trophy size={16} />
          Accedi per competere
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Season Leagues Panel ──────────────────────────────────────────────────

function SeasonLeaguesPanel({ myUserId }: { myUserId?: string }) {
  const { season, leagueId: myLeagueId, seasonPoints, timeLeft } = useSeason(myUserId);
  const [activeLeague, setActiveLeague] = useState<LeagueId>("bronze");
  const [standings, setStandings] = useState<SeasonStandingEntry[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  // Default active league to user's own league
  useEffect(() => {
    setActiveLeague(myLeagueId);
  }, [myLeagueId]);

  // Fetch standings for active league
  useEffect(() => {
    if (!season?.id) return;
    setStandingsLoading(true);
    fetch(`/api/seasons/standings?leagueId=${activeLeague}&seasonId=${season.id}`)
      .then((r) => r.json())
      .then((data) => {
        setStandings((data.entries as SeasonStandingEntry[]) ?? []);
      })
      .catch(() => setStandings([]))
      .finally(() => setStandingsLoading(false));
  }, [activeLeague, season?.id]);

  const myLeagueConfig = getLeagueConfig(myLeagueId);
  const viewConfig     = getLeagueConfig(activeLeague);

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* User's current season card */}
      {myUserId && (
        <SeasonBanner uid={myUserId} />
      )}

      {/* League selector strip */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Scegli la lega</p>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1">
          {LEAGUE_CONFIGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLeague(l.id as LeagueId)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-all",
                activeLeague === l.id
                  ? cn(l.bg, l.border, l.color)
                  : "bg-white/4 border-white/10 text-white/35"
              )}
            >
              <span>{l.emoji}</span>
              {l.label}
              {l.prizePoolCents > 0 && (
                <span className={cn("text-xs", activeLeague === l.id ? "opacity-70" : "opacity-40")}>
                  €{(l.prizePoolCents / 100).toFixed(0)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* League standings */}
      <div className={cn("rounded-2xl border overflow-hidden", viewConfig.bg, viewConfig.border)}>
        {/* League header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
          <div className="flex items-center gap-2">
            <span className="text-xl">{viewConfig.emoji}</span>
            <div>
              <p className={cn("font-black text-sm", viewConfig.color)}>{viewConfig.label}</p>
              {season && (
                <p className="text-xs text-white/35">Stagione {season.id}</p>
              )}
            </div>
          </div>
          {viewConfig.prizePoolCents > 0 && (
            <div className="text-right">
              <p className="text-xs text-white/35">Premi (1°/2°/3°)</p>
              <p className={cn("text-xs font-black", viewConfig.color)}>
                {viewConfig.prizes.map((c) => `€${(c / 100).toFixed(2)}`).join(" · ")}
              </p>
            </div>
          )}
          {viewConfig.prizePoolCents === 0 && (
            <p className="text-xs text-white/25 italic">Nessun premio monetario</p>
          )}
        </div>

        {/* Standings list */}
        {standingsLoading ? (
          <div className="flex items-center justify-center py-8 text-white/30 text-sm">
            Caricamento…
          </div>
        ) : standings.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center text-white/25">
            <span className="text-2xl mb-2">{viewConfig.emoji}</span>
            <p className="text-sm font-bold">Nessun giocatore ancora</p>
            <p className="text-xs mt-1">Scansiona monumenti per entrare!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {standings.map((entry, i) => {
              const isMe = entry.uid === myUserId;
              const isTop3 = entry.rank <= 3;
              const medal = ["🥇", "🥈", "🥉"][entry.rank - 1];
              const prizeAmount = viewConfig.prizes[entry.rank - 1] ?? 0;

              return (
                <motion.div
                  key={entry.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    isMe && "bg-[var(--s-primary)]/6"
                  )}
                >
                  <span className="w-6 text-center text-sm flex-shrink-0">
                    {isTop3 ? medal : <span className="text-xs text-white/30 font-bold">{entry.rank}</span>}
                  </span>
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 flex items-center justify-center">
                    {entry.photoURL ? (
                      <Image src={entry.photoURL} alt={entry.displayName} width={32} height={32} className="object-cover" />
                    ) : (
                      <span className="text-xs font-black text-white/60">
                        {entry.displayName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold truncate", isMe ? "text-[var(--s-primary)]" : "text-white")}>
                      {entry.displayName}
                      {isMe && <span className="ml-1 text-xs opacity-60 font-normal">(tu)</span>}
                    </p>
                    {prizeAmount > 0 && (
                      <p className="text-xs text-green-400 font-bold">
                        €{(prizeAmount / 100).toFixed(2)} a fine stagione
                      </p>
                    )}
                  </div>
                  <p className={cn("text-sm font-black tabular-nums flex-shrink-0", isTop3 ? viewConfig.color : "text-white/60")}>
                    {entry.seasonPoints.toLocaleString("it-IT")} pt
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Season countdown footer */}
      {season && timeLeft && (
        <div className="flex items-center justify-center gap-2 text-xs text-white/30">
          <Clock size={11} />
          <span>Fine stagione: {timeLeft} · Top 30% promossi, fondo 30% retrocessi</span>
        </div>
      )}
    </div>
  );
}

type LbTab = "points" | "photos" | "leagues";

// ── Main ──────────────────────────────────────────────────────────────────

export function LeaderboardView() {
  const { contest, loading: contestLoading, timeLeft } = useContest();
  const { entries, loading: listLoading } = useLeaderboard(contest?.id ?? null);
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [lbTab, setLbTab] = useState<LbTab>("photos");

  const isLoading = contestLoading || listLoading;
  const top3      = entries.slice(0, 3) as LeaderboardEntry[];
  const rest      = entries.slice(3);
  const myEntry   = entries.find((e) => e.userId === user?.uid);

  // Podium order: 2nd · 1st · 3rd
  const podium = ([top3[1], top3[0], top3[2]].filter(Boolean)) as LeaderboardEntry[];

  if (!user && !isLoading) {
    return (
      <>
        <div className="min-h-screen bg-slate-950 text-white">
          <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-950/95 px-4 pt-header pb-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Trophy className="text-[var(--s-primary)]" size={22} />
              <h1 className="text-xl font-black">Classifica</h1>
            </div>
          </div>
          <LockedLeaderboard onSignIn={() => setAuthOpen(true)} />
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-slate-950 pb-36 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-950/95 px-4 pt-header pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="text-[var(--s-primary)]" size={22} />
          <h1 className="text-xl font-black">Classifica</h1>
        </div>

        {contest && (
          <div className="rounded-2xl bg-gradient-to-r from-[var(--s-primary)]/18 to-[var(--s-primary)]/5 border border-[var(--s-primary)]/22 p-3.5 mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--s-primary)]/65 mb-0.5">Contest Attivo</p>
            <p className="font-black text-base text-white">{contest.title}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5 text-green-400 font-bold text-sm">
                <Coins size={13} />
                {formatCents(contest.prizePool)} in palio
              </div>
              <div className="flex items-center gap-1.5 text-white/45 text-xs">
                <Clock size={12} />
                {timeLeft}
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-0">
          {([
            { id: "photos"  as LbTab, label: "Voti Foto",  icon: Heart   },
            { id: "points"  as LbTab, label: "Punti GPS",  icon: Trophy  },
            { id: "leagues" as LbTab, label: "Leghe",      icon: Shield  },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setLbTab(id)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-black transition-colors",
                lbTab === id ? "text-[var(--s-primary)]" : "text-white/30",
              )}
            >
              <Icon size={14} />
              {label}
              {lbTab === id && (
                <motion.div
                  layoutId="lb-tab-indicator"
                  className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-[var(--s-primary)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Liquid tab transitions via AnimatePresence ────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        {lbTab === "photos" && (
          <motion.div
            key="photos-lb"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="px-4 pt-4 space-y-2"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-1.5">
              <Heart size={11} className="text-rose-400" fill="currentColor" />
              Classifica voti foto · {contest?.title ?? "Contest attivo"}
            </p>
            {MOCK_PHOTO_RANKINGS.map((entry, idx) => (
              <PhotoRankRow
                key={entry.userId}
                entry={entry}
                isMe={entry.userId === user?.uid}
                index={idx}
              />
            ))}
            <p className="text-xs text-white/20 text-center pt-2 pb-4">
              1 Like = 1 punto · 1 Super Like = 3 punti · I voti ricevuti determinano il premio
            </p>
          </motion.div>
        )}

        {lbTab === "points" && (
          <motion.div
            key="points-lb"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {isLoading ? (
              <LeaderboardSkeleton />
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/30">
                <Trophy size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Nessun partecipante ancora.</p>
                <p className="text-xs mt-1">Esplora i monumenti per entrare in classifica!</p>
              </div>
            ) : (
              <>
                {top3.length > 0 && (
                  <div className="px-4 pt-6 pb-2">
                    <div className="flex items-end justify-center gap-2">
                      {podium.map((entry) => (
                        <PodiumPlace
                          key={entry.userId}
                          entry={entry}
                          rank={entry.rank as 1 | 2 | 3}
                          isMe={entry.userId === user?.uid}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {rest.length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-xs font-bold text-white/25 uppercase tracking-widest">Tutti i partecipanti</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>
                )}
                <div className="px-4 space-y-2">
                  {rest.map((entry, idx) => (
                    <LeaderboardRow
                      key={entry.userId}
                      entry={entry}
                      isMe={entry.userId === user?.uid}
                      index={idx}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {lbTab === "leagues" && (
          <motion.div
            key="leagues-lb"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <SeasonLeaguesPanel myUserId={user?.uid} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed "Your Rank" bar */}
      {myEntry && !isLoading && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 32, delay: 0.45 }}
          className="fixed bottom-16 inset-x-0 z-30 px-3 pb-2"
        >
          <div className="flex items-center gap-3 rounded-2xl p-3.5 bg-slate-900/96 border border-[var(--s-primary)]/28 backdrop-blur-xl shadow-[0_-6px_32px_rgba(0,0,0,0.6)]">
            <Star size={15} className="text-[var(--s-primary)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-white/45">La tua posizione</p>
              <p className="text-sm font-black text-[var(--s-primary)]">#{myEntry.rank} · {myEntry.displayName}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-black">{myEntry.points.toLocaleString("it-IT")}</p>
              <p className="text-xs text-white/35">punti</p>
            </div>
            {myEntry.prizeShare && (
              <div className="rounded-xl bg-green-500/12 border border-green-500/22 px-2.5 py-1.5 text-xs font-black text-green-400">
                {formatCents(myEntry.prizeShare)}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
