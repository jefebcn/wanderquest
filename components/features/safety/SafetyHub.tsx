"use client";

/**
 * SafetyHub — Real-time global safety & economic monitoring card.
 *
 * Mobile-first design:
 *  - Minimum 44px touch targets throughout
 *  - Clear, readable font sizes (min 12px body text)
 *  - Compact default view: level badge + summary + tip
 *  - Details (events + inflation) expandable on tap
 *  - CRITICAL → red glow / WARNING → amber glow / STABLE → teal glow
 *  - Emergency button + bottom sheet for CRITICAL alerts
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Shield, ShieldAlert, ShieldCheck,
  AlertTriangle, PhoneCall, X, RefreshCw,
  TrendingUp, Newspaper, ChevronDown,
  Siren, ExternalLink,
} from "lucide-react";
import { cn }                         from "@/lib/utils";
import { Skeleton }                   from "@/components/ui/Skeleton";
import { getDestinationSafetyAudit }  from "@/actions/safety";
import { getEmergencyContacts }       from "@/lib/safety";
import { usePushNotifications }       from "@/hooks/usePushNotifications";
import type { SafetyAudit, SafetyLevel } from "@/types";

// ── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<SafetyLevel, {
  labelIt:     string;
  icon:        LucideIcon;
  glow:        string;
  glowStrong:  string;
  border:      string;
  bg:          string;
  badgeBg:     string;
  badgeText:   string;
  ringColor:   string;
  dotColor:    string;
}> = {
  STABLE: {
    labelIt:    "Sicuro",
    icon:       ShieldCheck,
    glow:       "0 4px 24px rgba(20,184,166,0.25)",
    glowStrong: "0 0 20px rgba(20,184,166,0.4)",
    border:     "border-teal-500/25",
    bg:         "bg-teal-500/[0.06]",
    badgeBg:    "bg-teal-500/15",
    badgeText:  "text-teal-300",
    ringColor:  "bg-teal-400",
    dotColor:   "bg-teal-400",
  },
  WARNING: {
    labelIt:    "Attenzione",
    icon:       ShieldAlert,
    glow:       "0 4px 24px rgba(245,158,11,0.30)",
    glowStrong: "0 0 20px rgba(245,158,11,0.5)",
    border:     "border-amber-500/30",
    bg:         "bg-amber-500/[0.06]",
    badgeBg:    "bg-amber-500/15",
    badgeText:  "text-amber-300",
    ringColor:  "bg-amber-400",
    dotColor:   "bg-amber-400",
  },
  CRITICAL: {
    labelIt:    "Critico",
    icon:       Shield,
    glow:       "0 4px 24px rgba(239,68,68,0.35)",
    glowStrong: "0 0 20px rgba(239,68,68,0.5)",
    border:     "border-red-500/35",
    bg:         "bg-red-500/[0.06]",
    badgeBg:    "bg-red-500/15",
    badgeText:  "text-red-300",
    ringColor:  "bg-red-400",
    dotColor:   "bg-red-400",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-50", color)} />
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", color)} />
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
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        className="relative z-10 rounded-t-3xl bg-[#0d0d1a] border-t border-red-500/30 px-5 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-5">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15">
              <Siren size={24} className="text-red-400" />
            </div>
            <div>
              <p className="font-black text-base text-white">Contatti di Emergenza</p>
              <p className="text-xs text-white/45 mt-0.5">{audit.countryName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/50 active:bg-white/15"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alert banner */}
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-4">
          <p className="text-xs font-bold text-red-300 uppercase tracking-wider mb-1.5">
            Allerta critica attiva
          </p>
          <p className="text-[13px] text-white/70 leading-relaxed">{audit.summary}</p>
        </div>

        {/* Contact rows — big tap targets */}
        <div className="space-y-3 mb-5">
          <ContactRow icon="🚔" label="Polizia locale"       number={contacts.police}    />
          <ContactRow icon="🚑" label="Emergenza sanitaria"  number={contacts.ambulance} />
          <ContactRow
            icon="🏛️"
            label={contacts.embassy}
            number={contacts.embassyPhone ?? "+39 06 36225"}
            sublabel="Unità di Crisi Farnesina (h24)"
          />
        </div>

        {/* Safety tip */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-4">
          <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest mb-1.5">
            Consiglio di sicurezza
          </p>
          <p className="text-[13px] text-white/70 leading-relaxed">{audit.tip}</p>
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
      className="flex items-center gap-3 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-4 min-h-[56px] active:bg-white/[0.08] transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white truncate">{label}</p>
        {sublabel && <p className="text-[11px] text-white/40 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-black text-white/80">{number}</span>
        <PhoneCall size={16} className="text-green-400 flex-shrink-0" />
      </div>
    </a>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface SafetyHubProps {
  /** When provided, show safety conditions for this destination instead of user's location */
  city?: { name: string; lat: number; lng: number } | null;
}

export function SafetyHub({ city }: SafetyHubProps = {}) {
  const [audit,           setAudit]           = useState<SafetyAudit | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [detailsOpen,     setDetailsOpen]     = useState(false);
  const [showEmergency,   setShowEmergency]   = useState(false);
  const [locationDenied,  setLocationDenied]  = useState(false);
  const { subscribe, storePosition }          = usePushNotifications();

  const loadAudit = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    storePosition(lat, lng);
    try {
      const result = await getDestinationSafetyAudit(lat, lng);
      setAudit(result);
      if (result.level !== "STABLE") subscribe();
    } catch {
      setError("Impossibile caricare i dati di sicurezza.");
    } finally {
      setLoading(false);
    }
  }, [subscribe, storePosition]);

  // When a destination city is passed, load its safety conditions directly
  useEffect(() => {
    if (city) {
      setLocationDenied(false);
      loadAudit(city.lat, city.lng);
      return;
    }
    // Fallback: user's current location
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadAudit(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLocationDenied(true);
        loadAudit(41.9028, 12.4964);
      },
      { timeout: 8000 }
    );
  }, [city, loadAudit]);

  // Auto-open emergency sheet for CRITICAL
  useEffect(() => {
    if (audit?.level === "CRITICAL") {
      const t = setTimeout(() => setShowEmergency(true), 1200);
      return () => clearTimeout(t);
    }
  }, [audit?.level]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-28 rounded-full" />
            <Skeleton className="h-2.5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full mb-2" />
        <Skeleton className="h-3 w-4/5 rounded-full" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error && !audit) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-6 text-center">
        <AlertTriangle size={24} className="text-amber-400 mx-auto mb-3" />
        <p className="text-[13px] text-white/50">{error}</p>
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => loadAudit(pos.coords.latitude, pos.coords.longitude),
                () => loadAudit(41.9028, 12.4964)
              );
            }
          }}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/40 active:text-white/70 min-h-[44px] px-3"
        >
          <RefreshCw size={12} />
          Riprova
        </button>
      </div>
    );
  }

  if (!audit) return null;

  const cfg       = LEVEL_CONFIG[audit.level];
  const LevelIcon = cfg.icon;
  const freshMin  = Math.round((Date.now() - audit.cachedAt) / 60_000);
  const hasDetails = audit.events.length > 0 || audit.inflation?.value != null;

  return (
    <>
      {/* ── Card ────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border backdrop-blur-xl",
          cfg.border, cfg.bg
        )}
        style={{ boxShadow: cfg.glow }}
      >
        {/* Glass shimmer */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)",
          }}
        />

        {/* ── Top row: icon + title + badge ─────────────────────────────── */}
        <div className="relative px-5 pt-5 pb-0 flex items-center gap-3">
          <div
            className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl", cfg.badgeBg)}
            style={{ boxShadow: cfg.glowStrong }}
          >
            <LevelIcon size={22} className={cfg.badgeText} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-black text-white leading-tight">
              {city ? city.name : "Safety Hub"}
            </p>
            <p className="text-xs text-white/40 mt-0.5 truncate">
              {city ? audit.countryName : (audit.countryName + (locationDenied ? " (approx.)" : ""))}
            </p>
          </div>

          {/* Level badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <PulsingDot color={cfg.dotColor} />
            <span className={cn(
              "text-[11px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full",
              cfg.badgeBg, cfg.badgeText
            )}>
              {cfg.labelIt}
            </span>
          </div>
        </div>

        {/* ── Summary ───────────────────────────────────────────────────── */}
        <div className="relative px-5 pt-4 pb-0">
          <p className="text-[13px] text-white/65 leading-relaxed">
            {audit.summary}
          </p>
        </div>

        {/* ── Tip ───────────────────────────────────────────────────────── */}
        <div className="relative mx-5 mt-4 flex items-start gap-2.5 rounded-xl bg-white/[0.05] px-4 py-3">
          <ShieldCheck size={14} className="text-white/30 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/50 leading-snug">{audit.tip}</p>
        </div>

        {/* ── CRITICAL: Emergenza button ────────────────────────────────── */}
        {audit.level === "CRITICAL" && (
          <div className="relative px-5 mt-4">
            <button
              onClick={() => setShowEmergency(true)}
              className={cn(
                "flex w-full items-center justify-center gap-2.5 rounded-2xl",
                "bg-red-600 py-4 min-h-[52px]",
                "text-[14px] font-black text-white",
                "active:scale-[0.98] transition-transform"
              )}
              style={{ boxShadow: "0 4px 20px rgba(239,68,68,0.45)" }}
            >
              <Siren size={18} />
              Contatti di Emergenza
            </button>
          </div>
        )}

        {/* ── Details toggle ────────────────────────────────────────────── */}
        {hasDetails && (
          <div className="relative px-5 mt-4">
            <button
              onClick={() => setDetailsOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] border border-white/8 py-3 min-h-[44px] active:bg-white/[0.08] transition-colors"
            >
              <span className="text-xs text-white/40 font-medium">
                {detailsOpen ? "Nascondi dettagli" : "Mostra dettagli"}
              </span>
              <motion.div
                animate={{ rotate: detailsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={14} className="text-white/30" />
              </motion.div>
            </button>
          </div>
        )}

        {/* ── Expandable details ────────────────────────────────────────── */}
        <AnimatePresence>
          {detailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 pt-4 space-y-4">
                {/* Inflation */}
                {audit.inflation?.value != null && (
                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3">
                    <TrendingUp size={16} className="text-white/30 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-white/40">
                        Inflazione {audit.inflation.year}
                      </p>
                      <p className={cn(
                        "text-sm font-black",
                        audit.inflation.value > 30
                          ? "text-red-400"
                          : audit.inflation.value > 10
                            ? "text-amber-400"
                            : "text-teal-400"
                      )}>
                        {audit.inflation.value.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Events list */}
                {audit.events.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Newspaper size={13} className="text-white/30" />
                      <p className="text-xs text-white/40 font-medium">
                        {audit.events.length} evento{audit.events.length > 1 ? "i" : ""} nelle ultime 24h
                      </p>
                    </div>
                    <div className="space-y-2">
                      {audit.events.map((ev, i) => (
                        <a
                          key={i}
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/6 px-4 py-3 min-h-[48px] active:bg-white/[0.07] transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/55 leading-snug line-clamp-2">
                              {ev.title}
                            </p>
                            <p className="text-[10px] text-white/25 mt-1">{ev.source}</p>
                          </div>
                          <ExternalLink size={12} className="text-white/20 flex-shrink-0 mt-0.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer: freshness + refresh ────────────────────────────────── */}
        <div className="relative flex items-center justify-between px-5 py-4 mt-2 border-t border-white/6">
          <p className="text-[11px] text-white/25">
            Aggiornato {freshMin <= 1 ? "adesso" : `${freshMin} min fa`}
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
            className="flex items-center gap-1.5 text-[11px] text-white/35 active:text-white/60 min-h-[44px] px-2 -mr-2 transition-colors"
          >
            <RefreshCw size={12} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* ── Emergency Sheet ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEmergency && audit && (
          <EmergencySheet audit={audit} onClose={() => setShowEmergency(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
