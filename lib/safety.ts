/**
 * Safety data fetching utilities.
 *
 * Data sources (both free, no API key required):
 *  - GDELT Doc API v2   → geopolitical conflict news (real-time, 15-min updates)
 *  - World Bank API     → CPI inflation indicator (annual, country-level)
 *
 * Results are cached in-process for CACHE_TTL_MS (1 hour) keyed by ISO-2
 * country code, so repeated renders don't cost extra API calls.
 */

import type { GeopoliticalEvent, InflationData } from "@/types";

// ── In-memory cache ──────────────────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1_000; // 1 hour

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const geoCache  = new Map<string, CacheEntry<GeopoliticalEvent[]>>();
const econCache = new Map<string, CacheEntry<InflationData | null>>();

function isFresh<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.timestamp < CACHE_TTL_MS;
}

// ── Country helpers ──────────────────────────────────────────────────────────

/** Reverse-geocode lat/lng → ISO-2 country code via public API (no key). */
export async function latLngToCountry(
  lat: number,
  lng: number
): Promise<{ iso2: string; name: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3`;
    const res  = await fetch(url, {
      headers: { "User-Agent": "WanderQuest/1.0 safety-monitor" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json() as {
      address?: { country_code?: string; country?: string };
    };
    const iso2 = data.address?.country_code?.toUpperCase();
    const name = data.address?.country ?? iso2 ?? "";
    return iso2 ? { iso2, name } : null;
  } catch {
    return null;
  }
}

// ── GDELT geopolitical events ────────────────────────────────────────────────

/**
 * Fetches recent conflict/violence news for a country using GDELT Doc API v2.
 * Returns up to 8 articles from the past 24 hours.
 */
export async function fetchGeopoliticalEvents(
  countryCode: string
): Promise<GeopoliticalEvent[]> {
  const cached = geoCache.get(countryCode);
  if (isFresh(cached)) return cached.data;

  try {
    // GDELT Full-Text Search — conflict keywords, filtered by source country
    const query = encodeURIComponent(
      "conflict OR bombing OR explosion OR civil war OR militia OR airstrike OR insurgency"
    );
    const url =
      `https://api.gdeltproject.org/api/v2/doc/doc` +
      `?query=${query}` +
      `&sourcecountry=${countryCode}` +
      `&mode=artlist` +
      `&maxrecords=8` +
      `&timespan=24h` +
      `&format=json`;

    const res = await fetch(url, { next: { revalidate: 900 } }); // 15-min server cache
    if (!res.ok) {
      geoCache.set(countryCode, { data: [], timestamp: Date.now() });
      return [];
    }

    const json = await res.json() as {
      articles?: Array<{
        title?: string;
        url?: string;
        seendate?: string;
        domain?: string;
      }>;
    };

    const events: GeopoliticalEvent[] = (json.articles ?? []).map((a) => ({
      title:       a.title ?? "Untitled",
      url:         a.url   ?? "#",
      publishedAt: a.seendate
        ? new Date(
            a.seendate.replace(
              /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
              "$1-$2-$3T$4:$5:$6Z"
            )
          ).toISOString()
        : new Date().toISOString(),
      source: a.domain ?? countryCode,
    }));

    geoCache.set(countryCode, { data: events, timestamp: Date.now() });
    return events;
  } catch {
    geoCache.set(countryCode, { data: [], timestamp: Date.now() });
    return [];
  }
}

// ── World Bank inflation data ────────────────────────────────────────────────

/**
 * Fetches the latest annual CPI inflation figure for a country.
 * World Bank API — free, no key required.
 * Returns null if unavailable.
 */
export async function fetchInflationData(
  countryCode: string
): Promise<InflationData | null> {
  const cached = econCache.get(countryCode);
  if (isFresh(cached)) return cached.data;

  try {
    // FP.CPI.TOTL.ZG = Consumer Price Index (annual %)
    const url =
      `https://api.worldbank.org/v2/country/${countryCode}` +
      `/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2&date=2022:2025`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      econCache.set(countryCode, { data: null, timestamp: Date.now() });
      return null;
    }

    const json = await res.json() as [
      { total?: number },
      Array<{ value: number | null; date: string } | null>,
    ];

    // Find the most recent non-null value
    const records = json[1] ?? [];
    const latest  = records.find((r) => r !== null && r.value !== null);
    if (!latest || latest.value === null) {
      econCache.set(countryCode, { data: null, timestamp: Date.now() });
      return null;
    }

    const result: InflationData = {
      value:       latest.value,
      year:        latest.date,
      countryCode: countryCode.toUpperCase(),
    };

    econCache.set(countryCode, { data: result, timestamp: Date.now() });
    return result;
  } catch {
    econCache.set(countryCode, { data: null, timestamp: Date.now() });
    return null;
  }
}

// ── Emergency contacts ───────────────────────────────────────────────────────

/** Static emergency number map (EU 112 default, common exceptions). */
const EMERGENCY_NUMBERS: Record<string, { police: string; ambulance: string }> = {
  US: { police: "911",  ambulance: "911"  },
  GB: { police: "999",  ambulance: "999"  },
  AU: { police: "000",  ambulance: "000"  },
  JP: { police: "110",  ambulance: "119"  },
  IN: { police: "100",  ambulance: "102"  },
  CN: { police: "110",  ambulance: "120"  },
  BR: { police: "190",  ambulance: "192"  },
  RU: { police: "102",  ambulance: "103"  },
  // Default EU / rest-of-world: 112
};

const ITALIAN_EMBASSY_PHONES: Record<string, string> = {
  US: "+1 (202) 612-4400",
  GB: "+44 (020) 7312-2200",
  FR: "+33 (0)1 49 54 03 00",
  DE: "+49 (030) 254440",
  ES: "+34 (91) 423-3300",
  PT: "+351 (21) 392-1000",
  GR: "+30 (210) 361-7260",
  CZ: "+420 (2) 5731-1644",
  HU: "+36 (1) 460-6900",
  AT: "+43 (1) 712-5121",
};

export function getEmergencyContacts(countryCode: string) {
  const numbers = EMERGENCY_NUMBERS[countryCode] ?? { police: "112", ambulance: "112" };
  return {
    police:       numbers.police,
    ambulance:    numbers.ambulance,
    embassy:      "Farnesina — Unità di Crisi",
    embassyPhone: ITALIAN_EMBASSY_PHONES[countryCode] ?? "+39 06 36225",
  };
}
