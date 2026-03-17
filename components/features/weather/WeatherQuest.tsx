"use client";

/**
 * WeatherQuest — AI-driven landmark suggestion card.
 *
 * Uses the OpenWeatherMap current-weather API (free tier) to read local
 * conditions, then recommends the best nearby landmark category to visit
 * right now.  Requires NEXT_PUBLIC_OPENWEATHER_KEY in .env.local.
 *
 * If no API key or the user hasn't granted location yet, the card shows a
 * default contextual suggestion without blocking the page.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Cloud, CloudRain, CloudSnow, Thermometer,
  Sparkles, MapPin, ChevronRight, Wind, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Weather types & fetching ──────────────────────────────────────────────

type WeatherCondition = "clear" | "clouds" | "rain" | "snow" | "wind" | "other";

interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  description: string;
  cityName: string;
}

async function fetchWeather(lat: number, lng: number, key: string): Promise<WeatherData | null> {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=it&appid=${key}`;
    const res  = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const d = await res.json() as {
      main: { temp: number; feels_like: number };
      weather: Array<{ main: string; description: string }>;
      name: string;
    };
    const raw = d.weather[0]?.main.toLowerCase() ?? "";
    let condition: WeatherCondition = "other";
    if (raw.includes("clear"))                              condition = "clear";
    else if (raw.includes("cloud"))                        condition = "clouds";
    else if (raw.includes("rain") || raw.includes("drizzle")) condition = "rain";
    else if (raw.includes("snow"))                         condition = "snow";
    else if (raw.includes("wind") || raw.includes("squall")) condition = "wind";
    return {
      temp:        Math.round(d.main.temp),
      feelsLike:   Math.round(d.main.feels_like),
      condition,
      description: d.weather[0]?.description ?? "",
      cityName:    d.name,
    };
  } catch {
    return null;
  }
}

// ── Suggestion engine ─────────────────────────────────────────────────────

interface Suggestion {
  headline: string;
  body: string;
  category: string;
  emoji: string;
  accentColor: string;
  gradient: string;
}

function getSuggestion(weather: WeatherData | null): Suggestion {
  if (!weather) {
    return {
      headline: "Esplora la città",
      body: "I monumenti storici del centro ti aspettano. Attiva la posizione per suggerimenti personalizzati.",
      category: "monument",
      emoji: "🏛️",
      accentColor: "text-blue-400",
      gradient: "from-blue-600/20 to-blue-900/0",
    };
  }

  const { condition, temp } = weather;

  if (condition === "rain" || condition === "snow") {
    return {
      headline: "Giornata da museo!",
      body: `Con ${weather.description} fuori, i musei coperti ti offrono un'esperienza perfetta — e asciutta.`,
      category: "museum",
      emoji: "🖼️",
      accentColor: "text-purple-400",
      gradient: "from-purple-600/20 to-purple-900/0",
    };
  }
  if (condition === "wind") {
    return {
      headline: "Vento in faccia = viste epiche",
      body: "I belvedere panoramici danno il meglio con vento: l'aria pulita regala orizzonti infiniti.",
      category: "viewpoint",
      emoji: "🌬️",
      accentColor: "text-cyan-400",
      gradient: "from-cyan-600/20 to-cyan-900/0",
    };
  }
  if (condition === "clear" && temp >= 22) {
    return {
      headline: "Sole e caldo — vai ai parchi!",
      body: `${temp}°C e cielo sereno: i parchi storici e i giardini sono al loro massimo splendore.`,
      category: "park",
      emoji: "🌿",
      accentColor: "text-green-400",
      gradient: "from-green-600/20 to-green-900/0",
    };
  }
  if (condition === "clear" && temp >= 12) {
    return {
      headline: "Luce dorata — monumenti!",
      body: `${temp}°C con cielo limpido: la luce naturale esalta i monumenti architettonici come nessun altro momento.`,
      category: "monument",
      emoji: "☀️",
      accentColor: "text-[#FFD700]",
      gradient: "from-yellow-600/20 to-yellow-900/0",
    };
  }
  if (condition === "clouds") {
    return {
      headline: "Luce diffusa = architettura perfetta",
      body: "Le nuvole eliminano le ombre dure: ideale per cattedrali e monumenti con molti dettagli scultorei.",
      category: "monument",
      emoji: "⛪",
      accentColor: "text-amber-400",
      gradient: "from-amber-600/20 to-amber-900/0",
    };
  }
  return {
    headline: "Giornata da esploratore",
    body: "Le condizioni meteo sono favorevoli. È il momento giusto per collezionare punti nelle vicinanze!",
    category: "other",
    emoji: "🗺️",
    accentColor: "text-blue-400",
    gradient: "from-blue-600/20 to-blue-900/0",
  };
}

// ── Weather icon ──────────────────────────────────────────────────────────

function WeatherIcon({ condition, size = 20 }: { condition: WeatherCondition; size?: number }) {
  const cls = "flex-shrink-0";
  switch (condition) {
    case "clear":  return <Sun       size={size} className={cn(cls, "text-[#FFD700]")} />;
    case "clouds": return <Cloud     size={size} className={cn(cls, "text-slate-300")} />;
    case "rain":   return <CloudRain size={size} className={cn(cls, "text-blue-400")} />;
    case "snow":   return <CloudSnow size={size} className={cn(cls, "text-cyan-300")} />;
    case "wind":   return <Wind      size={size} className={cn(cls, "text-cyan-400")} />;
    default:       return <Cloud     size={size} className={cn(cls, "text-slate-400")} />;
  }
}

// ── Main component ────────────────────────────────────────────────────────

interface Props {
  /** Pre-fetched coordinates — pass from parent to avoid double permission prompt */
  userLat?: number;
  userLng?: number;
}

export function WeatherQuest({ userLat, userLng }: Props) {
  const [weather,    setWeather]    = useState<WeatherData | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [locGranted, setLocGranted] = useState(false);

  const loadWeather = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
    if (!apiKey) { setLoading(false); return; }
    const data = await fetchWeather(lat, lng, apiKey);
    setWeather(data);
    setLoading(false);
  }, []);

  // If coordinates provided by parent, load immediately
  useEffect(() => {
    if (userLat !== undefined && userLng !== undefined) {
      setLocGranted(true);
      loadWeather(userLat, userLng);
    }
  }, [userLat, userLng, loadWeather]);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocGranted(true);
        loadWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => setLoading(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
    setLoading(true);
  }, [loadWeather]);

  const suggestion = getSuggestion(weather);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900"
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
    >
      {/* Gradient overlay */}
      <div
        className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", suggestion.gradient)}
      />

      {/* Shimmer while loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm rounded-3xl"
          >
            <RefreshCw size={20} className="text-white/40 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-0 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 border border-white/10">
              <Sparkles size={14} className="text-[#FFD700]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">AI Suggerimento</p>
              <p className="text-xs font-black text-white/70">Perfetto per adesso</p>
            </div>
          </div>

          {/* Live weather badge */}
          {weather ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-white/8 border border-white/10 px-2.5 py-1.5">
              <WeatherIcon condition={weather.condition} size={13} />
              <span className="text-xs font-black tabular-nums">{weather.temp}°C</span>
              <span className="text-[10px] text-white/40">{weather.cityName}</span>
            </div>
          ) : (
            !locGranted && (
              <button
                onClick={requestLocation}
                className="flex items-center gap-1 rounded-xl bg-white/8 border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white/50 hover:text-white/80 transition-colors"
              >
                <MapPin size={10} />
                Usa posizione
              </button>
            )
          )}
        </div>

        {/* Suggestion content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={suggestion.headline}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{suggestion.emoji}</span>
              <h3 className={cn("text-base font-black leading-tight", suggestion.accentColor)}>
                {suggestion.headline}
              </h3>
            </div>
            <p className="text-xs text-white/55 leading-relaxed mb-4">
              {suggestion.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            {weather && (
              <>
                <Thermometer size={10} />
                <span>Percepita {weather.feelsLike}°C · {weather.description}</span>
              </>
            )}
            {!weather && !locGranted && (
              <span>Attiva la posizione per dati meteo in tempo reale</span>
            )}
          </div>
          <a
            href="/scan"
            className={cn(
              "flex items-center gap-1 rounded-xl px-3 py-1.5",
              "text-xs font-black transition-colors",
              "bg-white/10 border border-white/15 text-white/70 hover:text-white hover:bg-white/15"
            )}
          >
            Esplora ora
            <ChevronRight size={11} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
