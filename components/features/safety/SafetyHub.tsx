"use client";

/**
 * SafetyHub — Real-time global safety & economic monitoring card.
 *
 * - Reads the user's current GPS position
 * - Calls `getDestinationSafetyAudit` (Server Action → Claude Haiku)
 * - Renders a "Liquid Glass" card with a dynamic glow:
 *     CRITICAL  → red glow   (wars / bombings)
 *     WARNING   → amber glow (economic crisis / unrest)
 *     STABLE    → teal glow  (all clear)
 * - Shows a fixed "Emergency" button (CRITICAL only) that opens a sheet
 *   with local police + Italian embassy contacts
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import {
  Shield, ShieldAlert, ShieldCheck,
  AlertTriangle, PhoneCall, X, RefreshCw,
  TrendingUp, Newspaper, ChevronDown, ChevronUp,
  Siren,
} from "lucide-react";
import { cn }                         from "@/lib/utils";
import { getDestinationSafetyAudit }  from "@/actions/safety";
import { getEmergencyContacts }       from "@/lib/safety";
import { usePushNotifications }       from "@/hooks/usePushNotifications";
import type { SafetyAudit, SafetyLevel } from "@/types";

// ── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<SafetyLevel, {
  label:       string;
  labelIt:     string;
  icon:        React.ElementType;
  glow:        string;   // box-shadow colour
  border:      string;   // tailwind border class
  gradient:    string;   // card bg gradient
  badgeBg:     string;   // badge background
  badgeText:   string;   // badge text colour
  ringColor:   string;   // pulse ring
}> = {
  STABLE: {
    label:      "STABLE",
    labelIt:    "Sicuro",
    icon:       ShieldCheck,
    glow:       "rgba(20,184,166,0.35)",
    border:     "border-teal-500/30",
    gradient:   "from-teal-500/10 via-teal-600/5 to-transparent",
    badgeBg:    "bg-teal-500/15",
    badgeText:  "text-teal-300",
    ringColor:  "bg-teal-400",
  },
  WARNING: {
    label:      "WARNING",
    labelIt:    "Attenzione",
    icon:       ShieldAlert,
    glow:       "rgba(245,158,11,0.40)",
    border:     "border-amber-500/35",
    gradient:   "from-amber-500/12 via-amber-600/5 to-transparent",
    badgeBg:    "bg-amber-500/15",
    badgeText:  "text-amber-300",
    ringColor:  "bg-amber-400",
  },
  CRITICAL: {
    label:      "CRITICAL",
    labelIt:    "Critico",
    icon:       Shield,
    glow:       "rgba(239,68,68,0.45)",
    border:     "border-red-500/40",
    gradient:   "from-red-500/14 via-red-600/6 to-transparent",
    badgeBg:    "bg-red-500/15",
    badgeText:  "text-red-300",
    ringColor:  "bg-red-400",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PulsingDot({ level }: { level: SafetyLevel }) {
  const { ringColor } = LEVEL_CONFIG[level];
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", ringColor)} />
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", ringColor)} />
    </span>
  );
}

function EmergencySheet({
  audit,
  onClose,
}: {
  audit: SafetyAudit;
  onClose: () => void;
}) {
  const contacts = getEmergencyContacts(audit.countryCode);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="relative z-10 rounded-t-3xl bg-[#0d0d1a] border-t border-red-500/30 px-5 pt-5 pb-[max(2rem,env(safe-area-inset-bottom))]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15">
              <Siren size={22} className="text-red-400" />
            </div>
            <div>
              <p className="font-black text-[15px] text-white">Contatti di Emergenza</p>
              <p className="text-[11px] text-white/45 mt-0.5">{audit.countryName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/50 hover:text-white"
            aria-label="Chiudi"
          >
            <X size={15} />
          </button>
        </div>

        {/* Critical alert banner */}
        <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/8 px-4 py-3">
          <p className="text-[11px] font-bold text-red-300 uppercase tracking-wider mb-1">
            Allerta CRITICA attiva
          </p>
          <p className="text-[12px] text-white/70 leading-snug">{audit.summary}</p>
        </div>

        {/* Contact cards */}
        <div className="space-y-3 mb-5">
          <ContactRow
            icon="🚔"
            label="Polizia locale"
            number={contacts.police}
          />
          <ContactRow
            icon="🚑"
            label="Emergenza sanitaria"
            number={contacts.ambulance}
          />
          <ContactRow
            icon="🏛️"
            label={contacts.embassy}
            number={contacts.embassyPhone ?? "+39 06 36225"}
            sublabel="Unità di Crisi Farnesina (h24)"
          />
        </div>

        {/* Tip */}
        <div className="rounded-xl bg-white/[0.04] border border-white/8 px-4 py-3">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
            Consiglio di sicurezza
          </p>
          <p className="text-[12px] text-white/75 leading-snug">{audit.tip}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ContactRow({
  icon,
  label,
  number,
  sublabel,
}: {
  icon: string;
  label: string;
  number: string;
  sublabel?: string;
}) {
  return (
    <a
      href={`tel:${number.replace(/\s/g, "")}`}
      className="flex items-center gap-3 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 active:scale-[0.98] transition-transform"
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-white truncate">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-white/40">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-black text-white/80">{number}</span>
        <PhoneCall size={13} className="text-green-400 flex-shrink-0" />
      </div>
    </a>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function SafetyHub() {
  const [audit,           setAudit]           = useState<SafetyAudit | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [showEvents,      setShowEvents]      = useState(false);
  const [showEmergency,   setShowEmergency]   = useState(false);
  const [locationDenied,  setLocationDenied]  = useState(false);
  const { subscribe, storePosition }          = usePushNotifications();

  const loadAudit = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    storePosition(lat, lng); // keep SW IndexedDB up to date for proximity checks
    try {
      const result = await getDestinationSafetyAudit(lat, lng);
      setAudit(result);
      // Subscribe to push notifications for CRITICAL or WARNING areas
      if (result.level !== "STABLE") {
        subscribe();
      }
    } catch {
      setError("Impossibile caricare i dati di sicurezza.");
    } finally {
      setLoading(false);
    }
  }, [subscribe, storePosition]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadAudit(pos.coords.latitude, pos.coords.longitude),
      () => {
        // Location denied — use a default safe fallback (Rome, IT)
        setLocationDenied(true);
        loadAudit(41.9028, 12.4964);
      },
      { timeout: 8000 }
    );
  }, [loadAudit]);

  // Auto-open emergency sheet if level is CRITICAL on first load
  useEffect(() => {
    if (audit?.level === "CRITICAL") {
      // Small delay so the card animation completes first
      const t = setTimeout(() => setShowEmergency(true), 1200);
      return () => clearTimeout(t);
    }
  }, [audit?.level]);

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-white/8" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 rounded-full bg-white/8" />
            <div className="h-2 w-32 rounded-full bg-white/5" />
          </div>
          <div className="h-6 w-16 rounded-full bg-white/8" />
        </div>
        <div className="space-y-2">
          <div className="h-2.5 rounded-full bg-white/5 w-full" />
          <div className="h-2.5 rounded-full bg-white/5 w-5/6" />
          <div className="h-2.5 rounded-full bg-white/5 w-4/6" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error && !audit) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center">
        <AlertTriangle size={22} className="text-amber-400 mx-auto mb-2" />
        <p className="text-[12px] text-white/50">{error}</p>
      </div>
    );
  }

  if (!audit) return null;

  const cfg = LEVEL_CONFIG[audit.level];
  const LevelIcon = cfg.icon;
  const freshMinutes = Math.round((Date.now() - audit.cachedAt) / 60_000);

  return (
    <>
      {/* ── Safety Card ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-5",
          cfg.border,
          cfg.gradient
        )}
        style={{
          boxShadow: `0 8px 40px ${cfg.glow}, 0 2px 12px rgba(0,0,0,0.4)`,
          background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
        }}
      >
        {/* Liquid glass shimmer overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)",
          }}
        />

        {/* Header */}
        <div className="relative flex items-start gap-3 mb-4">
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
              cfg.badgeBg
            )}
            style={{ boxShadow: `0 0 16px ${cfg.glow}` }}
          >
            <LevelIcon size={20} className={cfg.badgeText} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-black text-white leading-tight">
                Safety Hub
              </p>
              {locationDenied && (
                <span className="text-[9px] text-white/30 font-medium">(posizione approx.)</span>
              )}
            </div>
            <p className="text-[11px] text-white/45 mt-0.5 truncate">{audit.countryName}</p>
          </div>

          {/* Level badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <PulsingDot level={audit.level} />
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full",
                cfg.badgeBg,
                cfg.badgeText
              )}
            >
              {cfg.labelIt}
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="relative text-[12px] text-white/70 leading-relaxed mb-4">
          {audit.summary}
        </p>

        {/* Tip row */}
        <div className="relative flex items-start gap-2.5 rounded-xl bg-white/[0.04] border border-white/8 px-3.5 py-2.5 mb-4">
          <ShieldCheck size={13} className="text-white/35 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/55 leading-snug">{audit.tip}</p>
        </div>

        {/* Economic indicator */}
        {audit.inflation?.value != null && (
          <div className="relative flex items-center gap-2 mb-4">
            <TrendingUp size={12} className="text-white/30" />
            <p className="text-[10px] text-white/40">
              Inflazione {audit.inflation.year}:{" "}
              <span
                className={cn(
                  "font-bold",
                  audit.inflation.value > 30
                    ? "text-red-400"
                    : audit.inflation.value > 10
                    ? "text-amber-400"
                    : "text-teal-400"
                )}
              >
                {audit.inflation.value.toFixed(1)}%
              </span>
            </p>
          </div>
        )}

        {/* Recent events toggle */}
        {audit.events.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowEvents((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] border border-white/8 px-3.5 py-2.5 text-left"
            >
              <div className="flex items-center gap-2">
                <Newspaper size={12} className="text-white/30" />
                <span className="text-[10px] text-white/45 font-medium">
                  {audit.events.length} evento{audit.events.length > 1 ? "i" : ""} monitorat{audit.events.length > 1 ? "i" : "o"}
                </span>
              </div>
              {showEvents
                ? <ChevronUp size={13} className="text-white/25" />
                : <ChevronDown size={13} className="text-white/25" />}
            </button>

            <AnimatePresence>
              {showEvents && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-2 space-y-1.5"
                >
                  {audit.events.map((ev, i) => (
                    <li key={i}>
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl bg-white/[0.03] border border-white/6 px-3 py-2 hover:bg-white/[0.06] transition-colors"
                      >
                        <p className="text-[10px] text-white/60 leading-snug line-clamp-2">
                          {ev.title}
                        </p>
                        <p className="text-[9px] text-white/25 mt-0.5">{ev.source}</p>
                      </a>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Footer: freshness + refresh */}
        <div className="relative flex items-center justify-between mt-4 pt-3 border-t border-white/6">
          <p className="text-[9px] text-white/25">
            Aggiornato {freshMinutes <= 1 ? "adesso" : `${freshMinutes} min fa`}
          </p>
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => loadAudit(pos.coords.latitude, pos.coords.longitude),
                  () => loadAudit(41.9028, 12.4964)
                );
              }
            }}
            className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-colors"
          >
            <RefreshCw size={10} />
            Aggiorna
          </button>
        </div>
      </motion.div>

      {/* ── Fixed Emergency Button (CRITICAL only) ──────────────────────── */}
      <AnimatePresence>
        {audit.level === "CRITICAL" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            onClick={() => setShowEmergency(true)}
            className={cn(
              // Fixed above bottom nav, respects safe-area
              "fixed left-1/2 -translate-x-1/2 z-[100]",
              "flex items-center gap-2 px-5 py-3 rounded-2xl",
              "bg-red-600 shadow-[0_0_32px_rgba(239,68,68,0.6)] active:scale-95 transition-transform",
              // Position: above bottom nav (≈ 80px) + safe area
              "bottom-[calc(88px+env(safe-area-inset-bottom,0px))]"
            )}
            style={{
              boxShadow: "0 0 0 1px rgba(239,68,68,0.5), 0 8px 32px rgba(239,68,68,0.55)",
            }}
          >
            <Siren size={16} className="text-white" />
            <span className="text-[13px] font-black text-white">Emergenza</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Emergency Sheet ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEmergency && (
          <EmergencySheet
            audit={audit}
            onClose={() => setShowEmergency(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
