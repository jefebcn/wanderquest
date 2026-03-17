"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useContest }     from "@/hooks/useContest";
import { useAuth }        from "@/hooks/useAuth";
import { LeaderboardSkeleton } from "@/components/ui/Skeleton";
import { formatCents, formatDate } from "@/lib/utils";
import { Trophy, Clock, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-sm font-bold text-white/50">
      {rank}
    </span>
  );
}

export function LeaderboardView() {
  const { contest, loading: contestLoading, timeLeft } = useContest();
  const { entries, loading: listLoading } = useLeaderboard(contest?.id ?? null);
  const { user } = useAuth();

  const isLoading = contestLoading || listLoading;

  return (
    <div className="min-h-screen bg-[#080C1A] pb-20 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#080C1A]/95 px-4 pt-14 pb-4 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="text-amber-400" size={22} />
          <h1 className="text-xl font-black tracking-tight">Classifica</h1>
        </div>

        {contest && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-400/20 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              Contest Attivo
            </p>
            <p className="font-black text-lg text-white leading-tight mb-2">
              {contest.title}
            </p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-green-400 font-bold">
                <Coins size={14} />
                <span>{formatCents(contest.prizePool)} in palio</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/60">
                <Clock size={14} />
                <span>{timeLeft}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <Trophy size={48} className="mb-3 opacity-30" />
          <p className="text-sm">Nessun partecipante ancora.</p>
          <p className="text-xs mt-1">Esplora i monumenti per entrare in classifica!</p>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-2.5">
          {entries.map((entry) => {
            const isMe = entry.userId === user?.uid;
            return (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 rounded-2xl p-3 transition-colors",
                  isMe
                    ? "bg-amber-400/12 border border-amber-400/25"
                    : "bg-white/4"
                )}
              >
                <RankBadge rank={entry.rank} />

                {/* Avatar */}
                <div className="relative h-10 w-10 flex-shrink-0 rounded-full bg-amber-400/20 flex items-center justify-center overflow-hidden">
                  {entry.photoURL ? (
                    <Image
                      src={entry.photoURL}
                      alt={entry.displayName}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <span className="text-sm font-black text-amber-400">
                      {entry.displayName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name & visits */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-bold truncate", isMe && "text-amber-400")}>
                    {entry.displayName}
                    {isMe && <span className="ml-1 text-xs">(tu)</span>}
                  </p>
                  <p className="text-xs text-white/40">{entry.visits} visite</p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="text-sm font-black text-amber-400">{entry.points.toLocaleString("it-IT")} pt</p>
                  {entry.prizeShare && (
                    <p className="text-xs text-green-400">{formatCents(entry.prizeShare)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
