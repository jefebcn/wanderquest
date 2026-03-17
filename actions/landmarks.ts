"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getBoundingBox, haversineMetres } from "@/lib/geo";
import type { Landmark, NearbyLandmarksResult } from "@/types";

const SEARCH_RADIUS_M = 5_000; // 5 km default

/**
 * Server Action — returns landmarks within radius, sorted by distance.
 * Uses bounding-box pre-filter on lat/lng to minimise Firestore reads,
 * then applies precise Haversine for final distance.
 */
export async function getNearbyLandmarks(
  lat: number,
  lng: number,
  radiusMetres = SEARCH_RADIUS_M
): Promise<NearbyLandmarksResult> {
  const box = getBoundingBox({ lat, lng }, radiusMetres);
  const db  = adminDb();

  const snap = await db
    .collection("landmarks")
    .where("coordinates.lat", ">=", box.minLat)
    .where("coordinates.lat", "<=", box.maxLat)
    .get();

  const user = { lat, lng };
  const landmarks = snap.docs
    .map((doc) => {
      const data = doc.data() as Landmark;
      const distanceMetres = haversineMetres(user, data.coordinates);
      return { ...data, id: doc.id, distanceMetres };
    })
    .filter(
      (l) =>
        l.coordinates.lng >= box.minLng &&
        l.coordinates.lng <= box.maxLng &&
        l.distanceMetres <= radiusMetres
    )
    .sort((a, b) => a.distanceMetres - b.distanceMetres);

  return { landmarks };
}

/**
 * Returns a single landmark by ID with ISR-friendly caching.
 */
export async function getLandmarkById(id: string): Promise<Landmark | null> {
  const doc = await adminDb().collection("landmarks").doc(id).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as Landmark), id: doc.id };
}
