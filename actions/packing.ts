"use server";

/**
 * Smart Pack Agent — Server Action powered by Claude Haiku.
 *
 * Pipeline:
 *  1. Fetch current weather for the destination city (OpenWeatherMap).
 *  2. Build a contextual prompt with city, country, weather, and current month.
 *  3. Ask Claude Haiku to return a structured JSON packing list.
 *  4. Cache results in-process for 24 hours to minimise API costs.
 *
 * Returns { ok: true, data } or { ok: false, error } — never throws,
 * so Next.js Server Action errors are surfaced safely to the client.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  GeneratePackingListResult,
  PackingCategory,
  SafetyLevel,
} from "@/types";

// ── Response envelope ─────────────────────────────────────────────────────────

export type PackingListResponse =
  | { ok: true; data: GeneratePackingListResult }
  | { ok: false; error: string };

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

// ── Country-currency mapping ──────────────────────────────────────────────────

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
  ID: { code: "IDR", name: "Rupia indonesiana (IDR)" },
  SG: { code: "SGD", name: "Dollaro di Singapore (SGD)" },
  HK: { code: "HKD", name: "Dollaro di Hong Kong (HKD)" },
  KR: { code: "KRW", name: "Won sudcoreano (KRW)" },
  NO: { code: "NOK", name: "Corona norvegese (NOK)" },
  SE: { code: "SEK", name: "Corona svedese (SEK)" },
  DK: { code: "DKK", name: "Corona danese (DKK)" },
  PL: { code: "PLN", name: "Zloty polacco (PLN)" },
  CZ: { code: "CZK", name: "Corona ceca (CZK)" },
  HU: { code: "HUF", name: "Fiorino ungherese (HUF)" },
  RO: { code: "RON", name: "Leu romeno (RON)" },
  ZA: { code: "ZAR", name: "Rand sudafricano (ZAR)" },
  NZ: { code: "NZD", name: "Dollaro neozelandese (NZD)" },
  MY: { code: "MYR", name: "Ringgit malese (MYR)" },
  PH: { code: "PHP", name: "Peso filippino (PHP)" },
  VN: { code: "VND", name: "Dong vietnamita (VND)" },
  NG: { code: "NGN", name: "Naira nigeriano (NGN)" },
  AR: { code: "ARS", name: "Peso argentino (ARS)" },
  CL: { code: "CLP", name: "Peso cileno (CLP)" },
  CO: { code: "COP", name: "Peso colombiano (COP)" },
  PE: { code: "PEN", name: "Sol peruviano (PEN)" },
  IL: { code: "ILS", name: "Shekel israeliano (ILS)" },
  SA: { code: "SAR", name: "Riyal saudita (SAR)" },
  QA: { code: "QAR", name: "Riyal del Qatar (QAR)" },
  KW: { code: "KWD", name: "Dinaro kuwaitiano (KWD)" },
  BH: { code: "BHD", name: "Dinaro del Bahrein (BHD)" },
  JO: { code: "JOD", name: "Dinaro giordano (JOD)" },
  PK: { code: "PKR", name: "Rupia pakistana (PKR)" },
  BD: { code: "BDT", name: "Taka del Bangladesh (BDT)" },
  LK: { code: "LKR", name: "Rupia dello Sri Lanka (LKR)" },
  UA: { code: "UAH", name: "Grivnia ucraina (UAH)" },
  RU: { code: "RUB", name: "Rublo russo (RUB)" },
  IS: { code: "ISK", name: "Corona islandese (ISK)" },
  KE: { code: "KES", name: "Scellino keniota (KES)" },
  TZ: { code: "TZS", name: "Scellino tanzaniano (TZS)" },
  GH: { code: "GHS", name: "Cedi ghanese (GHS)" },
  ET: { code: "ETB", name: "Birr etiope (ETB)" },
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
- Destination: ${city}, ${country} (country code: ${countryCode})
- Month: ${month}
- Current weather: ${weatherDesc}, ${tempC}°C

INSTRUCTIONS:
1. Generate 5-8 items per category (Clothes, Electronics, Documents, Toiletries)
2. Be destination-specific: e.g., "Adattatore Tipo C" for Spain/Italy/Europe, "Spina adattatrice UK" for UK, high SPF sunscreen for tropical/sunny destinations
3. Account for weather: warm layers if cold, light clothing if hot, umbrella if rainy season
4. Mark essential=true only for items that absolutely cannot be forgotten (passport, phone charger, etc.)
5. Set safetyLevel: CRITICAL for active conflict zones, WARNING for unstable regions, STABLE for normal tourist destinations
6. If the country code is NOT in the EUR zone (not ES/IT/FR/DE/PT/GR/NL/BE/AT/FI/IE/LU/MT/SI/SK/EE/LV/LT/CY), provide the currency code

Respond ONLY with a valid JSON object — no markdown, no explanation, no code fences:
{
  "destination": "${city}",
  "country": "${country}",
  "countryCode": "${countryCode}",
  "weatherSummary": "Brief weather context in Italian (1 sentence)",
  "safetyLevel": "STABLE",
  "safetyAdvisory": null,
  "currencyCode": null,
  "currencyNote": null,
  "items": [
    {
      "id": "unique-kebab-id",
      "name": "Item name in Italian",
      "category": "Clothes",
      "emoji": "👕",
      "essential": false,
      "affiliateQuery": "English Amazon search query"
    }
  ]
}

Rules:
- All "name" fields in Italian
- "affiliateQuery" in English for Amazon search (e.g., "travel adapter type c europe", "sunscreen spf50 travel size")
- category must be exactly one of: Clothes, Electronics, Documents, Toiletries
- Return at least 20 items total, spread across all 4 categories
- safetyAdvisory: one-sentence safety tip in Italian, or null if fully safe`;
}

// ── Validation helpers ────────────────────────────────────────────────────────

const VALID_CATEGORIES: PackingCategory[] = [
  "Clothes",
  "Electronics",
  "Documents",
  "Toiletries",
];

const VALID_LEVELS: SafetyLevel[] = ["STABLE", "WARNING", "CRITICAL"];

// ── Server Action ─────────────────────────────────────────────────────────────

export async function generatePackingList(
  destination: string
): Promise<PackingListResponse> {
  try {
    const city = destination.trim();
    if (!city || city.length < 2) {
      return { ok: false, error: "Inserisci una destinazione valida (almeno 2 caratteri)." };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "Servizio AI non configurato. Contatta il supporto." };
    }

    const month = new Date().toLocaleString("en-US", { month: "long" });
    const key = cacheKey(city, month);

    // 1. Check cache
    const cached = packingCache.get(key);
    if (isFresh(cached)) {
      return { ok: true, data: cached.data };
    }

    // 2. Fetch weather (non-blocking — graceful fallback)
    const weather = await fetchWeather(city);
    const weatherDesc = weather?.description ?? "condizioni tipiche stagionali";
    const tempC = weather?.tempC ?? 20;
    const resolvedCountry = weather?.country ?? "";

    // 3. Resolve currency from OWM country code
    const currencyInfo = resolvedCountry ? (CURRENCY_MAP[resolvedCountry] ?? null) : null;

    // 4. Call Haiku (lazy client init inside the function)
    const client = new Anthropic({ apiKey });

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

    const raw =
      message.content[0]?.type === "text"
        ? message.content[0].text.trim()
        : "";

    // Strip markdown code fences if Haiku wraps them
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // 5. Parse response
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
      return { ok: false, error: "Risposta AI non valida. Riprova tra qualche secondo." };
    }

    const safetyLevel: SafetyLevel = VALID_LEVELS.includes(
      parsed.safetyLevel as SafetyLevel
    )
      ? (parsed.safetyLevel as SafetyLevel)
      : "STABLE";

    const result: GeneratePackingListResult = {
      destination: parsed.destination ?? city,
      country: parsed.country ?? resolvedCountry,
      countryCode: parsed.countryCode ?? resolvedCountry,
      weatherSummary:
        parsed.weatherSummary ??
        `Meteo attuale: ${weatherDesc}, ${tempC}°C`,
      month,
      items: (parsed.items ?? []).map((item, i) => ({
        id: item.id ?? `item-${i}`,
        name: item.name ?? "Articolo",
        category: VALID_CATEGORIES.includes(item.category as PackingCategory)
          ? (item.category as PackingCategory)
          : "Clothes",
        emoji: item.emoji ?? "🎒",
        essential: item.essential ?? false,
        affiliateQuery: item.affiliateQuery ?? item.name ?? "",
      })),
      safetyLevel,
      safetyAdvisory: parsed.safetyAdvisory ?? null,
      currencyCode:
        parsed.currencyCode ?? currencyInfo?.code ?? null,
      currencyNote:
        parsed.currencyNote ??
        (currencyInfo
          ? `La destinazione usa la ${currencyInfo.name}`
          : null),
    };

    // 6. Cache result
    packingCache.set(key, { data: result, timestamp: Date.now() });

    return { ok: true, data: result };
  } catch (err) {
    console.error("[SmartPackAgent] Unexpected error:", err);
    return {
      ok: false,
      error:
        "Errore durante la generazione della lista. Controlla la tua connessione e riprova.",
    };
  }
}
