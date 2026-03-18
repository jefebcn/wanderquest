import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface CitySearchResult {
  city: string;
  country: string;
  countryEmoji: string;
  description: string;
  restaurants: Array<{
    name: string;
    cuisine: string;
    rating: string;
    priceRange: string;
    tripadvisorRank: number;
  }>;
  typicalDish: {
    name: string;
    description: string;
    emoji: string;
  };
  monuments: Array<{
    name: string;
    description: string;
    emoji: string;
    mustSee: boolean;
  }>;
  nightlife: Array<{
    name: string;
    type: "Club" | "Bar" | "Lounge" | "Rooftop";
    description: string;
    vibe: string;
  }>;
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");

  if (!city || city.trim().length < 2) {
    return NextResponse.json({ error: "City name required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const prompt = `You are a travel guide expert. Provide detailed information about the city: "${city.trim()}".

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "city": "City name in local/Italian romanized form",
  "country": "Country name in Italian",
  "countryEmoji": "Country flag emoji",
  "description": "2-3 sentences describing the city in Italian",
  "restaurants": [
    {
      "name": "Restaurant name",
      "cuisine": "Cuisine type in Italian",
      "rating": "4.5",
      "priceRange": "€€",
      "tripadvisorRank": 1
    }
  ],
  "typicalDish": {
    "name": "Dish name",
    "description": "Brief description in Italian",
    "emoji": "Food emoji"
  },
  "monuments": [
    {
      "name": "Monument name",
      "description": "1 sentence in Italian",
      "emoji": "Relevant emoji",
      "mustSee": true
    }
  ],
  "nightlife": [
    {
      "name": "Venue name",
      "type": "Club",
      "description": "1 sentence in Italian",
      "vibe": "Atmosphere description in Italian"
    }
  ]
}

Rules:
- restaurants: exactly 3 items, ranked by TripAdvisor popularity (tripadvisorRank 1-3)
- monuments: 4-5 items, include the most iconic
- nightlife: 3-4 items (clubs, bars, lounges)
- All text fields must be in Italian
- rating must be a decimal string between "3.5" and "5.0"
- priceRange must be one of: "€", "€€", "€€€", "€€€€"
- type must be one of: "Club", "Bar", "Lounge", "Rooftop"`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse the JSON response
    let result: CitySearchResult;
    try {
      // Strip potential markdown code fences
      const cleaned = content.text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      throw new Error("Invalid JSON response from AI");
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("City search error:", err);
    return NextResponse.json(
      { error: "Impossibile ottenere le informazioni sulla città. Riprova." },
      { status: 500 },
    );
  }
}
