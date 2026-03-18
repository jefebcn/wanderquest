import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { LEAGUE_CONFIGS } from "@/lib/leagues";
import type { LeagueId, SeasonStandingEntry } from "@/types";

/**
 * GET /api/seasons/standings?leagueId=bronze&seasonId=2026-03
 *
 * Returns top 20 players in the given league for the given season,
 * ordered by seasonPoints desc.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leagueId  = searchParams.get("leagueId") as LeagueId | null;
  const seasonId  = searchParams.get("seasonId");

  if (!leagueId || !LEAGUE_CONFIGS.find((l) => l.id === leagueId)) {
    return NextResponse.json({ error: "Invalid leagueId" }, { status: 400 });
  }
  if (!seasonId) {
    return NextResponse.json({ error: "Missing seasonId" }, { status: 400 });
  }

  const db = adminDb();
  const snap = await db
    .collection("users")
    .where("leagueId", "==", leagueId)
    .where("currentSeasonId", "==", seasonId)
    .orderBy("seasonPoints", "desc")
    .limit(20)
    .get();

  const entries: SeasonStandingEntry[] = snap.docs.map((doc, i) => ({
    uid:          doc.id,
    displayName:  (doc.data().displayName as string) ?? "Giocatore",
    photoURL:     (doc.data().photoURL as string | undefined),
    seasonPoints: (doc.data().seasonPoints as number) ?? 0,
    leagueId:     leagueId,
    rank:         i + 1,
  }));

  return NextResponse.json({ entries, seasonId, leagueId });
}
