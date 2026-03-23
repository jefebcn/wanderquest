/**
 * WanderQuest Service Worker
 *
 * Handles:
 *  1. Push notifications — safety alerts for CRITICAL events
 *  2. 100km proximity check — compares event coordinates against the
 *     stored user position (saved by the page via postMessage)
 *  3. Notification click — opens the app at the Safety Hub
 */

const APP_CACHE   = "wanderquest-v1";
const SAFETY_TAG  = "wq-safety-alert";

// ── Install & Activate ────────────────────────────────────────────────────────

self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ── Push handler ──────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "WanderQuest Safety Alert", body: event.data.text() };
  }

  const {
    title       = "⚠️ Allerta Sicurezza",
    body        = "Nuovo evento critico rilevato nella tua area.",
    level       = "WARNING",      // "CRITICAL" | "WARNING"
    eventLat    = null,
    eventLng    = null,
    countryName = "",
  } = payload;

  // Proximity check — skip notification if event is > 100 km away
  const shouldNotify = event.waitUntil(
    self.registration.storage
      ? Promise.resolve(true)   // storage not available — always notify
      : checkProximity(eventLat, eventLng)
  );

  event.waitUntil(
    checkProximity(eventLat, eventLng).then((withinRadius) => {
      if (!withinRadius) return;

      const options = {
        body,
        tag:     SAFETY_TAG,
        renotify: level === "CRITICAL",
        icon:    "/icons/icon-192.png",
        badge:   "/icons/icon-192.png",
        vibrate: level === "CRITICAL" ? [200, 100, 200, 100, 400] : [200, 100, 200],
        data:    { url: "/?safety=1", level, countryName },
        actions: level === "CRITICAL"
          ? [
              { action: "emergency", title: "🚨 Emergenza" },
              { action: "dismiss",   title: "Ignora" },
            ]
          : [
              { action: "view",    title: "Vedi dettagli" },
              { action: "dismiss", title: "Ignora" },
            ],
      };

      return self.registration.showNotification(title, options);
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl =
    event.action === "emergency"
      ? "/?safety=emergency"
      : event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.postMessage({ type: "SAFETY_ALERT_OPEN", action: event.action });
          return;
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ── Proximity helper ──────────────────────────────────────────────────────────

/**
 * Returns true if the stored user position is within 100 km of the event.
 * Falls back to true (always notify) if position is unavailable.
 */
async function checkProximity(eventLat, eventLng) {
  if (eventLat === null || eventLng === null) return true;

  try {
    // User position is saved by the page to IndexedDB via the push-utils below
    const db       = await openPositionDB();
    const position = await getStoredPosition(db);
    if (!position) return true;

    const distanceKm = haversineKm(
      position.lat, position.lng,
      eventLat,     eventLng
    );
    return distanceKm <= 100;
  } catch {
    return true;
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R      = 6371; // km
  const toRad  = (d) => (d * Math.PI) / 180;
  const dLat   = toRad(lat2 - lat1);
  const dLng   = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openPositionDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("wq-safety", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("position", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function getStoredPosition(db) {
  return new Promise((resolve) => {
    const tx  = db.transaction("position", "readonly");
    const req = tx.objectStore("position").get("user");
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => resolve(null);
  });
}

// ── Message from page: store user position ────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type !== "STORE_POSITION") return;
  const { lat, lng } = event.data;
  openPositionDB().then((db) => {
    const tx    = db.transaction("position", "readwrite");
    const store = tx.objectStore("position");
    store.put({ id: "user", lat, lng, savedAt: Date.now() });
  });
});
