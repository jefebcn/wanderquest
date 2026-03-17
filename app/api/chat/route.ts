import { streamText } from "ai";
import { openai }    from "@ai-sdk/openai";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * AI Travel Concierge — streaming chat endpoint (Pro-only).
 *
 * Requires env vars:
 *   OPENAI_API_KEY          - OpenAI API key
 *
 * Context accepted from client:
 *   messages  - Chat history (AI SDK format)
 *   context   - { lat?, lng?, weather?, visitedLandmarkNames? }
 */

export const runtime = "nodejs"; // needs firebase-admin (no edge)
export const maxDuration = 30;

interface ChatContext {
  lat?: number;
  lng?: number;
  weather?: { description: string; temp: number; condition: string };
  visitedLandmarkNames?: string[];
}

function buildSystemPrompt(ctx: ChatContext): string {
  const locationPart = ctx.lat && ctx.lng
    ? `L'utente si trova attualmente a coordinate ${ctx.lat.toFixed(5)}, ${ctx.lng.toFixed(5)} (probabile area di Barcellona).`
    : "La posizione precisa dell'utente non è disponibile. Assumi che siano a Barcellona.";

  const weatherPart = ctx.weather
    ? `Meteo attuale: ${ctx.weather.description}, temperatura ${ctx.weather.temp}°C.`
    : "Dati meteo non disponibili.";

  const visitedPart = ctx.visitedLandmarkNames?.length
    ? `Monumenti già visitati oggi: ${ctx.visitedLandmarkNames.join(", ")}.`
    : "Nessun monumento ancora visitato oggi.";

  return `Sei il concierge AI di WanderQuest, l'assistente di viaggio personale dell'utente per Barcellona.
Il tuo obiettivo è suggerire il miglior prossimo landmark da visitare adesso, tenendo conto di:
- Posizione attuale
- Condizioni meteo
- Monumenti già visitati
- Orario del giorno

${locationPart}
${weatherPart}
${visitedPart}

Regole:
1. Rispondi SEMPRE in italiano.
2. Sii conciso: massimo 3 frasi per risposta.
3. Suggerisci sempre UN monumento specifico con il suo nome reale.
4. Motiva brevemente perché è il migliore in questo momento.
5. Aggiungi il numero approssimativo di punti WanderQuest che si guadagnano.
6. Se ti chiedono altro (meteo, orari, come arrivare) rispondi utilmente ma sempre in italiano.`;
}

export async function POST(req: Request) {
  // ── Auth check (Pro only) ─────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Non autenticato" }), { status: 401 });
  }

  try {
    const tok     = authHeader.slice(7);
    const decoded = await adminAuth().verifyIdToken(tok);

    // Check Pro custom claim
    if (decoded.tier !== "pro") {
      return new Response(
        JSON.stringify({ error: "Pro required" }),
        { status: 403 }
      );
    }
  } catch {
    return new Response(JSON.stringify({ error: "Token non valido" }), { status: 401 });
  }

  // ── Stream response ───────────────────────────────────────────
  const { messages, context = {} } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    context?: ChatContext;
  };

  const result = streamText({
    model:     openai("gpt-4o"),
    system:    buildSystemPrompt(context),
    messages,
    maxOutputTokens: 350,
  });

  return result.toDataStreamResponse();
}
