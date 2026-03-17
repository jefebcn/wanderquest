"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GeoPoint } from "@/types";

export type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "active"; position: GeoPoint; accuracy: number }
  | { status: "error"; message: string };

export interface UseUserLocationOptions {
  /** Automatically start watching on mount. Default: true */
  autoStart?: boolean;
  /** High accuracy mode. Default: true */
  enableHighAccuracy?: boolean;
  /** Max age in ms for cached positions. Default: 10000 */
  maximumAge?: number;
  /** Timeout in ms. Default: 15000 */
  timeout?: number;
  /** Called every time the position updates */
  onUpdate?: (position: GeoPoint, accuracy: number) => void;
}

export function useUserLocation(opts: UseUserLocationOptions = {}) {
  const {
    autoStart          = true,
    enableHighAccuracy = true,
    maximumAge         = 10_000,
    timeout            = 15_000,
    onUpdate,
  } = opts;

  const [state, setState] = useState<LocationState>({ status: "idle" });
  const watchIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: "error", message: "Geolocalizzazione non supportata." });
      return;
    }

    stop();
    setState({ status: "requesting" });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const position: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setState({ status: "active", position, accuracy: pos.coords.accuracy });
        onUpdate?.(position, pos.coords.accuracy);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Permesso negato. Abilita la localizzazione nelle impostazioni.",
          2: "Posizione non disponibile. Controlla la connessione GPS.",
          3: "Timeout GPS. Riprova.",
        };
        setState({ status: "error", message: messages[err.code] ?? err.message });
      },
      { enableHighAccuracy, maximumAge, timeout }
    );
  }, [stop, enableHighAccuracy, maximumAge, timeout, onUpdate]);

  useEffect(() => {
    if (autoStart) start();
    return stop;
  }, [autoStart, start, stop]);

  const position = state.status === "active" ? state.position : null;
  const accuracy = state.status === "active" ? state.accuracy : null;

  return {
    state,
    position,
    accuracy,
    isLoading:  state.status === "requesting",
    isActive:   state.status === "active",
    hasError:   state.status === "error",
    errorMsg:   state.status === "error" ? state.message : null,
    start,
    stop,
  };
}
