"use server";

/**
 * Smart Pack Agent — Server Action powered by Claude Haiku.
 *
 * Pipeline:
 *  1. Fetch current weather for the destination city (OpenWeatherMap).
 *  2. Build a contextual prompt with city, country, weather, and current month.
 *  3. Ask Claude Haiku to return a structured JSON packing list.
 *  4. Cache results in-process for 24 hours to minimise API costs.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GeneratePackingListResult, SafetyLevel } from "@/types";

// ── In-memory cache (24 hours) ───────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

interface CacheEntry {
  data: GeneratePackingListResult;
  timestamp: number;
}

const packingCache = new Map<string, CacheEntry>();

function isFresh(entry: CacheEntry | undefined): entry is CacheEntry {
  return !!entry && Date.now() - entry.timestamp < CACHE_TTL_MS;
}

// Cache key: lowercased city + month (weather can vary but we accept daily staleness)
function cacheKey(city: string, month: string): string {
  return `${city.toLowerCase().trim()}::${month.toLowerCase()}`;
}

// ── OpenWeatherMap helper ─────────────────────────────────────────────────────

interface OWMWeather {
  description: string;
  tempC: number;
  humidity: number;
  cityName: string;
  country: string;
}

async function fetchWeather(city: string): Promise<OWMWeather | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=it`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json() as {
      weather?: Array<{ description: string }>;
      main?: { temp: number; humidity: number };
      name?: string;
      sys?: { country: string };
    };

    return {
      description: data.weather?.[0]?.description ?? "condizioni variabili",
      tempC: Math.round(data.main?.temp ?? 20),
      humidity: data.main?.humidity ?? 50,
      cityName: data.name ?? city,
      country: data.sys?.country ?? "",
    };
  } catch {
    return null;
  }
}

// ── Country-currency mapping (non-EUR destinations common for Italian travelers) ─

const CURRENCY_MAP: Record<string, { code: string; name: string }> = {
  GB: { code: "GBP", name: "Sterlina britannica (GBP)" },
  US: { code: "USD", name: "Dollaro USA (USD)" },
  JP: { code: "JPY", name: "Yen giapponese (JPY)" },
  CH: { code: "CHF", name: "Franco svizzero (CHF)" },
  AU: { code: "AUD", name: "Dollaro australiano (AUD)" },
  CA: { code: "CAD", name: "Dollaro canadese (CAD)" },
  CN: { code: "CNY", name: "Yuan cinese (CNY)" },
  BR: { code: "BRL", name: "Real brasiliano (BRL)" },
  TR: { code: "TRY", name: "Lira turca (TRY)" },
  MX: { code: "MXN", name: "Peso messicano (MXN)" },
  IN: { code: "INR", name: "Rupia indiana (INR)" },
  TH: { code: "THB", name: "Baht tailandese (THB)" },
  AE: { code: "AED", name: "Dirham degli EAU (AED)" },
  MA: { code: "MAD", name: "Dirham marocchino (MAD)" },
  EG: { code: "EGP", name: "Sterlina egiziana (EGP)" },
};

// ── Haiku prompt ──────────────────────────────────────────────────────────────

function buildPrompt(
  city: string,
  country: string,
  countryCode: string,
  weatherDesc: string,
  tempC: number,
  month: string
): string {
  return `You are an expert travel packing assistant. Generate a personalized packing list for a traveler.

TRIP DETAILS:
- Destination: ${city}, ${country} (${countryCode})
- Month: ${month}
- Current weather: ${weatherDesc}, ${tempC}°C

INSTRUCTIONS:
1. Generate 5-8 items per category (Clothes, Electronics, Documents, Toiletries)
2. Be destination-specific: e.g., "Adattatore Type C" for Spain/Europe, "Spina UK" for UK, UV protection for sunny destinations
3. Account for weather: warm clothes if cold, sunscreen if hot, umbrella if rainy season
4. Mark essential=true only for items that cannot be forgotten (passport, phone charger, etc.)
5. Detect any notable safety concern for ${city} — set safetyLevel to CRITICAL/WARNING/STABLE
6. If ${countryCode} is NOT in the EUR zone, provide the currency code and a brief note in Italian

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "destination": "${city}",
  "country": "${country}",
  "countryCode": "${countryCode}",
  "weatherSummary": "Brief weather context in Italian (1 sentence)",
  "safetyLevel": "STABLE" or "WARNING" or "CRITICAL",
  "safetyAdvisory": "One safety/travel tip for ${city} in Italian, or null if fully safe",
  "currencyCode": "ISO currency code if not EUR, else null",
  "currencyNote": "Italian note about local currency (e.g. 'Londra usa la Sterlina (GBP)'), or null if EUR",
  "items": [
    {
      "id": "unique-kebab-id",
      "name": "Item name in Italian",
      "category": "Clothes",
      "emoji": "relevant emoji",
      "essential": false,
      "affiliateQuery": "English Amazon search query for this item"
    }
  ]
}

Rules:
- All "name" fields in Italian
- "affiliateQuery" in English for Amazon search (e.g., "travel adapter type c europe", "sunscreen spf50")
- category must be exactly one of: Clothes, Electronics, Documents, Toiletries
- safetyLevel must be STABLE for normal tourist destinations
- Return at least 20 items total across all 4 categories`;
}

// ── Server Action ─────────────────────────────────────────────────────────────

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generatePackingList(
  destination: string
): Promise<GeneratePackingListResult> {
  const city = destination.trim();
  if (!city || city.length < 2) {
    throw new Error("Inserisci una destinazione valida.");
  }

  const month = new Date().toLocaleString("en-US", { month: "long" });
  const key = cacheKey(city, month);

  // 1. Check cache
  const cached = packingCache.get(key);
  if (isFresh(cached)) {
    return cached.data;
  }

  // 2. Fetch weather (non-blocking — fallback to generic if unavailable)
  const weather = await fetchWeather(city);
  const weatherDesc = weather?.description ?? "condizioni tipiche stagionali";
  const tempC = weather?.tempC ?? 20;
  const resolvedCountry = weather?.country ?? "";

  // 3. Resolve currency from country code
  const currencyInfo = resolvedCountry ? CURRENCY_MAP[resolvedCountry] ?? null : null;

  // 4. Call Haiku
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Servizio AI non configurato.");
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: buildPrompt(
          weather?.cityName ?? city,
          resolvedCountry || "Destinazione",
          resolvedCountry || "XX",
          weatherDesc,
          tempC,
          month
        ),
      },
    ],
  });

  const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  let parsed: {
    destination?: string;
    country?: string;
    countryCode?: string;
    weatherSummary?: string;
    safetyLevel?: string;
    safetyAdvisory?: string | null;
    currencyCode?: string | null;
    currencyNote?: string | null;
    items?: Array<{
      id?: string;
      name?: string;
      category?: string;
      emoji?: string;
      essential?: boolean;
      affiliateQuery?: string;
    }>;
  };

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Risposta AI non valida. Riprova.");
  }

  const validLevels: SafetyLevel[] = ["STABLE", "WARNING", "CRITICAL"];
  const safetyLevel = validLevels.includes(parsed.safetyLevel as SafetyLevel)
    ? (parsed.safetyLevel as SafetyLevel)
    : "STABLE";

  const result: GeneratePackingListResult = {
    destination: parsed.destination ?? city,
    country: parsed.country ?? resolvedCountry,
    countryCode: parsed.countryCode ?? resolvedCountry,
    weatherSummary: parsed.weatherSummary ?? `Meteo attuale: ${weatherDesc}, ${tempC}°C`,
    month,
    items: (parsed.items ?? []).map((item, i) => ({
      id: item.id ?? `item-${i}`,
      name: item.name ?? "Articolo",
      category: (["Clothes", "Electronics", "Documents", "Toiletries"].includes(item.category ?? "")
        ? item.category
        : "Clothes") as import("@/types").PackingCategory,
      emoji: item.emoji ?? "🎒",
      essential: item.essential ?? false,
      affiliateQuery: item.affiliateQuery ?? item.name ?? "",
    })),
    safetyLevel,
    safetyAdvisory: parsed.safetyAdvisory ?? null,
    currencyCode: parsed.currencyCode ?? currencyInfo?.code ?? null,
    currencyNote: parsed.currencyNote ?? (currencyInfo ? `La destinazione usa la ${currencyInfo.name}` : null),
  };

  // 5. Store in cache
  packingCache.set(key, { data: result, timestamp: Date.now() });

  return result;
}
