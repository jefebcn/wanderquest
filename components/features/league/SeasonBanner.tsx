"use client";

/**
 * SeasonBanner
 *
 * Shows the user's current league, season points, promotion zone progress,
 * and a countdown to end of season. Used in leaderboard and profile.
 */

import { motion } from "framer-motion";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useSeason } from "@/hooks/useSeason";
import { LEAGUE_CONFIGS, getLeagueConfig, getNextLeague, getPrevLeague } from "@/lib/leagues";
import { cn } from "@/lib/utils";

interface Props {
  uid?: string;
}

export function SeasonBanner({ uid }: Props) {
  const { season, leagueId, leagueConfig, seasonPoints, timeLeft, loading } = useSeason(uid);

  if (loading) return null;

  const nextLeague = getNextLeague(leagueId);
  const prevLeague = getPrevLeague(leagueId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border p-4 space-y-3", leagueConfig.bg, leagueConfig.border)}
      style={{ boxShadow: `0 4px 24px ${leagueConfig.glow}` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{leagueConfig.emoji}</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">La tua lega</p>
            <p className={cn("text-base font-black", leagueConfig.color)}>{leagueConfig.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/35">Punti stagione</p>
          <p className="text-xl font-black tabular-nums">{seasonPoints.toLocaleString("it-IT")}</p>
        </div>
      </div>

      {/* Season info row */}
      {season && (
        <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-bold">
          <Clock size={11} />
          <span>Stagione {season.id}</span>
          <span className="text-white/20">·</span>
          <span>{timeLeft}</span>
        </div>
      )}

      {/* Prize info */}
      {leagueConfig.prizePoolCents > 0 && (
        <div className="rounded-xl bg-black/20 px-3 py-2 flex items-center justify-between">
          <p className="text-[11px] text-white/45">Premio Top 3 di questa lega</p>
          <p className={cn("text-xs font-black", leagueConfig.color)}>
            {[leagueConfig.prizes[0], leagueConfig.prizes[1], leagueConfig.prizes[2]]
              .map((c) => `€${(c / 100).toFixed(2)}`)
              .join(" · ")}
          </p>
        </div>
      )}

      {/* Promotion / relegation zones */}
      <div className="flex gap-2 text-[10px]">
        {nextLeague && (
          <div className="flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-1 text-green-400 font-bold">
            <TrendingUp size={9} />
            Top 30% → {nextLeague.label}
          </div>
        )}
        {!nextLeague && (
          <div className="flex items-center gap-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 px-2 py-1 text-[#FFD700] font-bold">
            <span>👑</span>
            Lega massima!
          </div>
        )}
        {prevLeague ? (
          <div className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-1 text-red-400 font-bold">
            <TrendingDown size={9} />
            Fondo 30% → {prevLeague.label}
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-1 text-white/35 font-bold">
            <Minus size={9} />
            Lega di ingresso
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── League tier overview (used in standings) ──────────────────────────────

export function LeagueTierRow({
  leagueId,
  isCurrentUser,
}: {
  leagueId: string;
  isCurrentUser?: boolean;
}) {
  const config = getLeagueConfig(leagueId as Parameters<typeof getLeagueConfig>[0]);
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black border",
      config.bg, config.border, config.color,
      isCurrentUser && "ring-1 ring-[#FFD700]/40"
    )}>
      <span>{config.emoji}</span>
      {config.label}
    </div>
  );
}

// ── All leagues overview strip ─────────────────────────────────────────────

export function LeagueStripOverview({ currentLeagueId }: { currentLeagueId: string }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] py-1">
      {LEAGUE_CONFIGS.map((l, i) => {
        const isCurrent = l.id === currentLeagueId;
        const isPast = LEAGUE_CONFIGS.findIndex((x) => x.id === currentLeagueId) > i;
        return (
          <div key={l.id} className="flex items-center gap-1 flex-shrink-0">
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all",
              isCurrent
                ? cn(l.bg, l.border, l.color, "scale-105")
                : isPast
                  ? "bg-white/5 border-white/15 text-white/40"
                  : "bg-black/20 border-white/8 text-white/20"
            )}>
              <span>{l.emoji}</span>
              {l.label}
            </div>
            {i < LEAGUE_CONFIGS.length - 1 && (
              <span className="text-white/15 text-[10px]">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
