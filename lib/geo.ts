import type { GeoPoint } from "@/types";

const EARTH_RADIUS_M = 6_371_000; // metres

/**
 * Haversine formula — returns distance between two coordinates in metres.
 */
export function haversineMetres(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat  = toRad(b.lat - a.lat);
  const dLng  = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Returns true if the user is within the landmark's check-in radius.
 */
export function isWithinRadius(
  user: GeoPoint,
  landmark: GeoPoint,
  radiusMetres: number
): boolean {
  return haversineMetres(user, landmark) <= radiusMetres;
}

/**
 * Returns the bounding box for a point at a given radius — used to
 * pre-filter Firestore documents before the precise Haversine check.
 */
export function getBoundingBox(
  center: GeoPoint,
  radiusMetres: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = (radiusMetres / EARTH_RADIUS_M) * (180 / Math.PI);
  const lngDelta =
    latDelta / Math.cos((center.lat * Math.PI) / 180);
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}
