"use server";

/**
 * getDestinationSafetyAudit — Safety Concierge powered by Claude Haiku.
 *
 * 1. Reverse-geocodes the provided lat/lng to a country.
 * 2. Fetches geopolitical conflict events (GDELT) + inflation data (World Bank).
 * 3. Sends combined raw data to Claude claude-haiku-4-5-20251001 for parsing.
 * 4. Returns a structured SafetyAudit with level (CRITICAL / WARNING / STABLE),
 *    a 1-3 sentence summary and a single safety tip.
 *
 * All external data is cached for 1 hour server-side (see lib/safety.ts).
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  latLngToCountry,
  fetchGeopoliticalEvents,
  fetchInflationData,
} from "@/lib/safety";
import type { SafetyAudit, SafetyLevel } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Haiku prompt ─────────────────────────────────────────────────────────────

function buildPrompt(
  countryName: string,
  events: Array<{ title: string }>,
  inflation: { value: number | null; year: string } | null
): string {
  const eventsText =
    events.length > 0
      ? events.map((e, i) => `${i + 1}. ${e.title}`).join("\n")
      : "No recent conflict events detected.";

  const inflationText =
    inflation?.value != null
      ? `Annual CPI inflation in ${inflation.year}: ${inflation.value.toFixed(1)}%`
      : "Inflation data unavailable.";

  return `You are a travel-safety intelligence analyst. Analyze the situation in ${countryName}.

GEOPOLITICAL EVENTS (last 24 h):
${eventsText}

ECONOMIC DATA:
${inflationText}

INSTRUCTIONS:
- If you detect active bombings, civil war, military conflict, or mass violence, set level to CRITICAL.
- If you detect severe economic crisis (inflation > 30%), significant protests, or political instability, set level to WARNING.
- Otherwise, set level to STABLE.
- Write a "summary" of max 3 sentences describing the current situation for a tourist.
- Write a "tip" of 1 sentence: a concrete safety or practical advice for travelers.
- Keep language professional and factual, not alarmist unless the level is CRITICAL.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "level": "STABLE" | "WARNING" | "CRITICAL",
  "summary": "...",
  "tip": "..."
}`;
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function getDestinationSafetyAudit(
  lat: number,
  lng: number
): Promise<SafetyAudit> {
  // 1. Resolve country
  const country = await latLngToCountry(lat, lng);
  const countryCode = country?.iso2 ?? "IT";
  const countryName = country?.name ?? "Unknown";

  // 2. Fetch risk data in parallel
  const [events, inflation] = await Promise.all([
    fetchGeopoliticalEvents(countryCode),
    fetchInflationData(countryCode),
  ]);

  // 3. Call Haiku for structured advisory
  let level:   SafetyLevel = "STABLE";
  let summary = `Nessun evento critico rilevato in ${countryName}. Le condizioni per i viaggiatori appaiono nella norma.`;
  let tip     = "Tieniti aggiornato sulle news locali e mantieni i documenti con te.";

  try {
    const message = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages:   [
        {
          role:    "user",
          content: buildPrompt(countryName, events, inflation),
        },
      ],
    });

    const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    // Strip markdown code fences if Haiku wraps in them
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed  = JSON.parse(jsonStr) as {
      level?: string;
      summary?: string;
      tip?: string;
    };

    const validLevels: SafetyLevel[] = ["STABLE", "WARNING", "CRITICAL"];
    if (parsed.level && validLevels.includes(parsed.level as SafetyLevel)) {
      level = parsed.level as SafetyLevel;
    }
    if (parsed.summary) summary = parsed.summary;
    if (parsed.tip)     tip     = parsed.tip;
  } catch {
    // Fallback: rule-based heuristic if Haiku is unavailable
    const criticalKeywords = [
      "bombing", "civil war", "explosion", "airstrike", "militia",
      "bombardamento", "guerra civile", "attentato",
    ];
    const warningKeywords  = [
      "protest", "unrest", "riot", "strike", "demonstration",
      "protesta", "disordini", "sciopero",
    ];
    const allTitles = events.map((e) => e.title.toLowerCase()).join(" ");

    if (criticalKeywords.some((kw) => allTitles.includes(kw))) {
      level   = "CRITICAL";
      summary = `Attività violente rilevate in ${countryName}. Si consiglia massima prudenza.`;
      tip     = "Evita luoghi affollati e segui le indicazioni dell'ambasciata locale.";
    } else if (
      warningKeywords.some((kw) => allTitles.includes(kw)) ||
      (inflation?.value != null && inflation.value > 30)
    ) {
      level   = "WARNING";
      summary = `Situazione instabile in ${countryName}. Monitorare gli sviluppi locali.`;
      tip     = "Verifica gli avvisi del Ministero degli Esteri prima di partire.";
    }
  }

  return {
    level,
    summary,
    tip,
    countryCode,
    countryName,
    events: events.slice(0, 5),
    inflation,
    cachedAt: Date.now(),
  };
}
