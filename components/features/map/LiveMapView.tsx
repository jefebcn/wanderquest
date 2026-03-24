"use client";

/**
 * LiveMapView — Full-screen interactive Leaflet map for the /explore page.
 *
 * IMPORTANT: Must be imported via next/dynamic with { ssr: false } to avoid
 * Leaflet's window/document references crashing on the server.
 *
 *   const LiveMapView = dynamic(
 *     () => import("@/components/features/map/LiveMapView").then(m => ({ default: m.LiveMapView })),
 *     { ssr: false }
 *   );
 */

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { formatDistance } from "@/lib/utils";
import type { GeoPoint, Landmark } from "@/types";

type LandmarkWithDist = Landmark & { distanceMetres: number };

// ── Fix Leaflet default icon resolution in Next.js ────────────────────────
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
}

// ── Sub-component: keeps map centered on user as GPS updates ──────────────
// Only recenters when user hasn't interacted with the map in the last 8s,
// and only when position has moved more than ~3 metres.
function RecenterMap({ position }: { position: GeoPoint }) {
  const map = useMap();
  const userInteracted = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevPos = useRef(position);

  useEffect(() => {
    const onInteract = () => {
      userInteracted.current = true;
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        userInteracted.current = false;
      }, 8000);
    };
    map.on("dragstart", onInteract);
    map.on("zoomstart", onInteract);
    return () => {
      map.off("dragstart", onInteract);
      map.off("zoomstart", onInteract);
      clearTimeout(resetTimer.current);
    };
  }, [map]);

  useEffect(() => {
    if (userInteracted.current) return;
    const dist = Math.hypot(
      position.lat - prevPos.current.lat,
      position.lng - prevPos.current.lng
    );
    if (dist > 0.00003) { // ~3 metres in degrees
      map.panTo([position.lat, position.lng], { animate: true });
      prevPos.current = position;
    }
  }, [position.lat, position.lng, map]);

  return null;
}

// ── Custom marker: pulsing teal dot for user position ─────────────────────
function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;transform:translate(-50%,-50%)">
        <div style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(45,212,191,0.18);animation:wq-ping 2.2s ease-out infinite"></div>
        <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(45,212,191,0.25);animation:wq-ping 2.2s ease-out 0.55s infinite"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:#2dd4bf;border:2.5px solid white;box-shadow:0 0 14px rgba(45,212,191,0.9),0 0 4px rgba(45,212,191,0.5)"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

// ── Custom marker: landmark pin with photo thumbnail + points badge ────────
function createLandmarkIcon(lm: LandmarkWithDist): L.DivIcon {
  const dist = formatDistance(lm.distanceMetres);
  const withinRadius = lm.distanceMetres <= lm.radius;
  const borderColor = withinRadius ? "#4ade80" : "#ffd700";
  const glowColor   = withinRadius ? "rgba(74,222,128,0.5)" : "rgba(255,215,0,0.45)";
  const imgContent  = lm.imageUrl
    ? `<img src="${lm.imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" loading="lazy" />`
    : `<div style="width:100%;height:100%;background:#1e293b;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;">🏛️</div>`;

  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5))">
        <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;border:2.5px solid ${borderColor};box-shadow:0 0 12px ${glowColor};">
          ${imgContent}
        </div>
        <div style="margin-top:4px;background:${borderColor};color:#0f172a;font-size:9.5px;font-weight:900;padding:2.5px 7px;border-radius:999px;white-space:nowrap;letter-spacing:0.02em;box-shadow:0 2px 8px ${glowColor}">
          +${lm.points}pt${withinRadius ? " · Sei qui!" : ` · ${dist}`}
        </div>
      </div>
    `,
    iconSize: [100, 72],
    iconAnchor: [50, 60],
    popupAnchor: [0, -60],
  });
}

// ── Main component ────────────────────────────────────────────────────────

interface LiveMapViewProps {
  position: GeoPoint;
  landmarks: LandmarkWithDist[];
  onLandmarkSelect: (lm: LandmarkWithDist) => void;
}

export function LiveMapView({ position, landmarks, onLandmarkSelect }: LiveMapViewProps) {
  const fixedRef = useRef(false);

  useEffect(() => {
    if (!fixedRef.current) {
      fixLeafletIcons();
      fixedRef.current = true;
    }
  }, []);

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={15}
      style={{ height: "100%", width: "100%", background: "#0f172a" }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* OSM tile layer — free, no API key required */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        className="map-tiles-dark"
      />

      {/* Follow user position as it updates */}
      <RecenterMap position={position} />

      {/* User position */}
      <Marker
        position={[position.lat, position.lng]}
        icon={createUserIcon()}
        zIndexOffset={1000}
      />

      {/* Landmark markers */}
      {landmarks.map((lm) => (
        <Marker
          key={lm.id}
          position={[lm.coordinates.lat, lm.coordinates.lng]}
          icon={createLandmarkIcon(lm)}
          eventHandlers={{
            click: () => onLandmarkSelect(lm),
          }}
        />
      ))}
    </MapContainer>
  );
}
