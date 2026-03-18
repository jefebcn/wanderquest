"use client";

/**
 * useSeason
 *
 * Subscribes to meta/active_season in Firestore and provides:
 *  - Current season metadata (id, startAt, endAt)
 *  - The current user's seasonPoints and leagueId
 *  - Countdown string to end of season
 */

import { useState, useEffect } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { onSnapshot, doc, onSnapshot as onSnapshotDoc } from "firebase/firestore";
import { getLeagueConfig } from "@/lib/leagues";
import type { Season, LeagueId } from "@/types";
import type { LeagueConfig } from "@/lib/leagues";

interface UseSeasonResult {
  season:        Season | null;
  leagueId:      LeagueId;
  leagueConfig:  LeagueConfig;
  seasonPoints:  number;
  timeLeft:      string;
  loading:       boolean;
}

function formatCountdown(endAt: string): string {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return "Stagione conclusa";

  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000)  / 60_000);

  if (days > 0)   return `${days}g ${hours}h rimasti`;
  if (hours > 0)  return `${hours}h ${minutes}m rimasti`;
  return `${minutes}m rimasti`;
}

export function useSeason(uid?: string): UseSeasonResult {
  const [season,       setSeason]       = useState<Season | null>(null);
  const [leagueId,     setLeagueId]     = useState<LeagueId>("bronze");
  const [seasonPoints, setSeasonPoints] = useState(0);
  const [timeLeft,     setTimeLeft]     = useState("");
  const [loading,      setLoading]      = useState(true);

  // Subscribe to active season metadata
  useEffect(() => {
    const { db } = getFirebaseClient();
    const metaRef = doc(db, "meta", "active_season");

    const unsub = onSnapshot(metaRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSeason({
          id:      data.seasonId as string,
          startAt: data.startAt  as string,
          endAt:   data.endAt    as string,
          status:  data.status   as Season["status"],
        });
        setTimeLeft(formatCountdown(data.endAt as string));
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  // Subscribe to user's league + seasonPoints
  useEffect(() => {
    if (!uid) return;
    const { db } = getFirebaseClient();
    const userRef = doc(db, "users", uid);

    const unsub = onSnapshotDoc(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLeagueId((data.leagueId as LeagueId | undefined) ?? "bronze");
        setSeasonPoints((data.seasonPoints as number | undefined) ?? 0);
      }
    });

    return unsub;
  }, [uid]);

  // Tick countdown every minute
  useEffect(() => {
    if (!season) return;
    const interval = setInterval(() => {
      setTimeLeft(formatCountdown(season.endAt));
    }, 60_000);
    return () => clearInterval(interval);
  }, [season]);

  return {
    season,
    leagueId,
    leagueConfig: getLeagueConfig(leagueId),
    seasonPoints,
    timeLeft,
    loading,
  };
}
