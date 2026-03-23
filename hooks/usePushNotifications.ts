"use client";

/**
 * usePushNotifications
 *
 * Registers the service worker, requests push permission, subscribes to Web Push
 * and stores the user's GPS position so the SW can do 100km proximity checks.
 *
 * Usage:  call once at app level (e.g. inside SafetyHub after CRITICAL is detected)
 */

import { useEffect, useCallback } from "react";

export function usePushNotifications() {
  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      // 1. Register (or get existing) service worker
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // 2. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // 3. Fetch VAPID public key
      const keyRes = await fetch("/api/notifications/subscribe");
      if (!keyRes.ok) return;
      const { publicKey } = await keyRes.json() as { publicKey: string };

      // 4. Create (or retrieve) push subscription
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 5. Send subscription to server
      await fetch("/api/notifications/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ subscription: sub.toJSON() }),
      });
    } catch (err) {
      console.warn("[push] subscription failed:", err);
    }
  }, []);

  // Store user GPS position in SW IndexedDB for proximity checks
  const storePosition = useCallback((lat: number, lng: number) => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: "STORE_POSITION", lat, lng });
    });
  }, []);

  // Auto-store position on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => storePosition(pos.coords.latitude, pos.coords.longitude),
      () => {} // silent fail — SW uses "always notify" fallback
    );
  }, [storePosition]);

  return { subscribe, storePosition };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  const buf     = new ArrayBuffer(raw.length);
  const view    = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return view;
}
