import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  LEAGUE_CONFIGS,
  computeNewLeague,
  getNextSeasonId,
  getSeasonStartDate,
  getSeasonEndDate,
} from "@/lib/leagues";
import { FieldValue } from "firebase-admin/firestore";
import type { LeagueId } from "@/types";

/**
 * GET /api/seasons/end
 *
 * Called automatically by Vercel Cron on the 1st of each month at 00:05 UTC.
 * Can also be triggered manually (POST or GET) with CRON_SECRET.
 *
 * Algorithm:
 *  1. Load active season from meta/active_season
 *  2. For each of the 5 leagues:
 *     a. Query users in that league for this season, ordered by seasonPoints desc
 *     b. Award prizes to top 3 (credit to wallet)
 *     c. Compute new leagueId for each user (promotion/relegation)
 *  3. Create next season document
 *  4. Batch-update all users: new leagueId, reset seasonPoints=0, new currentSeasonId
 *  5. Mark old season as ended, update meta/active_season to new season
 */

async function handler(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (
    auth !== `Bearer ${process.env.CRON_SECRET}` &&
    auth !== `Bearer ${process.env.VERCEL_CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();

  // 1. Load active season
  const metaSnap = await db.collection("meta").doc("active_season").get();
  if (!metaSnap.exists) {
    return NextResponse.json({ error: "No active season found" }, { status: 404 });
  }

  const activeSeason = metaSnap.data()!;
  const currentSeasonId = activeSeason.seasonId as string;
  const nextSeasonId    = getNextSeasonId(currentSeasonId);

  const results: Record<string, { total: number; promoted: number; relegated: number; prizesAwarded: number }> = {};

  // Collect all user updates across leagues
  interface UserUpdate {
    uid: string;
    newLeagueId: LeagueId;
    prizeToAddCents: number;
  }
  const allUserUpdates: UserUpdate[] = [];

  // 2. Process each league
  for (const league of LEAGUE_CONFIGS) {
    const snap = await db
      .collection("users")
      .where("leagueId", "==", league.id)
      .where("currentSeasonId", "==", currentSeasonId)
      .orderBy("seasonPoints", "desc")
      .get();

    const total = snap.docs.length;
    let promoted = 0;
    let relegated = 0;
    let prizesAwarded = 0;

    snap.docs.forEach((doc, rank0) => {
      const rank = rank0 + 1; // 1-indexed
      const uid  = doc.id;

      // Determine new league
      const newLeagueId = computeNewLeague(league.id as LeagueId, rank, total);
      if (newLeagueId !== league.id) {
        const isPromotion = LEAGUE_CONFIGS.find((l) => l.id === newLeagueId)!.tier > league.tier;
        if (isPromotion) promoted++;
        else relegated++;
      }

      // Prize for top 3
      const prizeToAddCents = rank <= 3 ? (league.prizes[rank - 1] ?? 0) : 0;
      if (prizeToAddCents > 0) prizesAwarded += prizeToAddCents;

      allUserUpdates.push({ uid, newLeagueId: newLeagueId as LeagueId, prizeToAddCents });
    });

    results[league.id] = { total, promoted, relegated, prizesAwarded };
  }

  // 3. Batch update users (Firestore limit = 500 writes per batch)
  const now = new Date().toISOString();
  const BATCH_SIZE = 400;

  for (let i = 0; i < allUserUpdates.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = allUserUpdates.slice(i, i + BATCH_SIZE);

    for (const { uid, newLeagueId, prizeToAddCents } of chunk) {
      // Update user doc
      batch.set(
        db.collection("users").doc(uid),
        {
          leagueId:        newLeagueId,
          seasonPoints:    0,
          currentSeasonId: nextSeasonId,
          prevSeasonId:    currentSeasonId,
        },
        { merge: true }
      );

      // Credit prize to wallet if applicable
      if (prizeToAddCents > 0) {
        batch.set(
          db.collection("wallets").doc(uid),
          {
            balanceCents:     FieldValue.increment(prizeToAddCents),
            totalEarnedCents: FieldValue.increment(prizeToAddCents),
            updatedAt:        now,
          },
          { merge: true }
        );
      }
    }

    await batch.commit();
  }

  // 4. Create new season document
  await db.collection("seasons").doc(nextSeasonId).set({
    id:      nextSeasonId,
    startAt: getSeasonStartDate(nextSeasonId),
    endAt:   getSeasonEndDate(nextSeasonId),
    status:  "active",
  });

  // 5. Archive old season + update meta
  await db.collection("seasons").doc(currentSeasonId).set(
    { status: "ended", endedAt: now },
    { merge: true }
  );

  await db.collection("meta").doc("active_season").set({
    seasonId: nextSeasonId,
    startAt:  getSeasonStartDate(nextSeasonId),
    endAt:    getSeasonEndDate(nextSeasonId),
    status:   "active",
  });

  return NextResponse.json({
    ok:             true,
    endedSeason:    currentSeasonId,
    newSeason:      nextSeasonId,
    totalUsers:     allUserUpdates.length,
    leagueResults:  results,
  });
}

export const GET  = handler;
export const POST = handler;
