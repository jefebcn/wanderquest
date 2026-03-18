import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  getCurrentSeasonId,
  getSeasonStartDate,
  getSeasonEndDate,
} from "@/lib/leagues";

/**
 * POST /api/seasons/init
 *
 * Creates the active_season meta document if it doesn't exist.
 * Call once to bootstrap the season system.
 *
 * Protected by CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seasonId = getCurrentSeasonId();
  const db = adminDb();
  const metaRef = db.collection("meta").doc("active_season");
  const snap = await metaRef.get();

  if (snap.exists) {
    return NextResponse.json({ message: "Season already initialized", seasonId: snap.data()?.seasonId });
  }

  await metaRef.set({
    seasonId,
    startAt: getSeasonStartDate(seasonId),
    endAt:   getSeasonEndDate(seasonId),
    status:  "active",
  });

  return NextResponse.json({ message: "Season initialized", seasonId });
}
