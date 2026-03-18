/**
 * League system constants and helpers.
 *
 * 5 tiers — monthly seasons — top 30% promoted, bottom 30% relegated.
 * New users always start in Bronzo.
 */

export type LeagueId = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface LeagueConfig {
  id: LeagueId;
  tier: number; // 1 = lowest
  label: string;
  emoji: string;
  color: string;
  border: string;
  bg: string;
  glow: string;
  /** Total prize pool distributed among top 3 at season end (cents) */
  prizePoolCents: number;
  /** [1st, 2nd, 3rd] prize in cents */
  prizes: [number, number, number];
}

export const LEAGUE_CONFIGS: LeagueConfig[] = [
  {
    id: "bronze",
    tier: 1,
    label: "Bronzo",
    emoji: "🥉",
    color: "text-amber-600",
    border: "border-amber-700/30",
    bg: "bg-amber-900/10",
    glow: "rgba(180,83,9,0.20)",
    prizePoolCents: 0,
    prizes: [0, 0, 0],
  },
  {
    id: "silver",
    tier: 2,
    label: "Argento",
    emoji: "🥈",
    color: "text-slate-300",
    border: "border-slate-400/30",
    bg: "bg-slate-800/20",
    glow: "rgba(148,163,184,0.15)",
    prizePoolCents: 500,
    prizes: [300, 150, 50],
  },
  {
    id: "gold",
    tier: 3,
    label: "Oro",
    emoji: "🥇",
    color: "text-[#FFD700]",
    border: "border-[#FFD700]/25",
    bg: "bg-[#FFD700]/5",
    glow: "rgba(255,215,0,0.15)",
    prizePoolCents: 1500,
    prizes: [900, 450, 150],
  },
  {
    id: "platinum",
    tier: 4,
    label: "Platino",
    emoji: "💎",
    color: "text-cyan-300",
    border: "border-cyan-400/25",
    bg: "bg-cyan-900/10",
    glow: "rgba(103,232,249,0.12)",
    prizePoolCents: 5000,
    prizes: [3000, 1500, 500],
  },
  {
    id: "diamond",
    tier: 5,
    label: "Diamante",
    emoji: "💠",
    color: "text-blue-300",
    border: "border-blue-400/25",
    bg: "bg-blue-900/10",
    glow: "rgba(147,197,253,0.15)",
    prizePoolCents: 15000,
    prizes: [9000, 4500, 1500],
  },
];

export function getLeagueConfig(id: LeagueId): LeagueConfig {
  return LEAGUE_CONFIGS.find((l) => l.id === id) ?? LEAGUE_CONFIGS[0];
}

export function getNextLeague(id: LeagueId): LeagueConfig | null {
  const current = getLeagueConfig(id);
  return LEAGUE_CONFIGS.find((l) => l.tier === current.tier + 1) ?? null;
}

export function getPrevLeague(id: LeagueId): LeagueConfig | null {
  const current = getLeagueConfig(id);
  return LEAGUE_CONFIGS.find((l) => l.tier === current.tier - 1) ?? null;
}

/** Returns seasonId in "YYYY-MM" format for the current UTC month */
export function getCurrentSeasonId(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** ISO string for the first moment of the current UTC month */
export function getSeasonStartDate(seasonId?: string): string {
  const id = seasonId ?? getCurrentSeasonId();
  const [y, m] = id.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0)).toISOString();
}

/** ISO string for the last millisecond of the current UTC month */
export function getSeasonEndDate(seasonId?: string): string {
  const id = seasonId ?? getCurrentSeasonId();
  const [y, m] = id.split("-").map(Number);
  const firstOfNext = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  return new Date(firstOfNext.getTime() - 1).toISOString();
}

/**
 * Determine the next season ID ("YYYY-MM") that follows the given one.
 */
export function getNextSeasonId(seasonId: string): string {
  const [y, m] = seasonId.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, 1)); // first of next month
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Compute new leagueId after promotion/relegation.
 * Promotion: top `promotionCount` players move up one tier.
 * Relegation: bottom `relegationCount` players move down one tier.
 */
export function computeNewLeague(
  currentLeague: LeagueId,
  rank: number,
  total: number
): LeagueId {
  if (total < 2) return currentLeague; // not enough players to promote/relegate

  const promotionCount = Math.max(1, Math.floor(total * 0.3));
  const relegationCount = Math.max(1, Math.floor(total * 0.3));

  if (rank <= promotionCount) {
    return getNextLeague(currentLeague)?.id ?? currentLeague;
  }
  if (rank > total - relegationCount) {
    return getPrevLeague(currentLeague)?.id ?? currentLeague;
  }
  return currentLeague;
}
