"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserLocation }  from "@/hooks/useUserLocation";
import { useScanner }       from "@/hooks/useScanner";
import { useContest }       from "@/hooks/useContest";
import { getNearbyLandmarks } from "@/actions/landmarks";
import { formatDistance }   from "@/lib/utils";
import { VoiceSynthesizer } from "@/components/features/voice/VoiceSynthesizer";
import { BottomSheet }      from "@/components/ui/BottomSheet";
import { LandmarkCardSkeleton } from "@/components/ui/Skeleton";
import type { Landmark }    from "@/types";
import {
  ScanLine, MapPin, CheckCircle, AlertCircle, Loader2,
  ChevronRight, Radar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PartnerWidget } from "@/components/features/partners/PartnerWidget";

type LandmarkWithDist = Landmark & { distanceMetres: number };

// ── Pulsing beacon for "you are here" ────────────────────────────────────

function PulseBeacon() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
    </span>
  );
}

// ── Landmark bottom sheet ─────────────────────────────────────────────────

function LandmarkSheet({
  landmark,
  distanceMetres,
  open,
  onClose,
  scanning,
  onCheckIn,
}: {
  landmark: LandmarkWithDist;
  distanceMetres: number;
  open: boolean;
  onClose: () => void;
  scanning: boolean;
  onCheckIn: () => void;
}) {
  const withinRadius = distanceMetres <= landmark.radius;
  const pct          = Math.min(100, (landmark.radius / Math.max(distanceMetres, 1)) * 100);

  return (
    <BottomSheet open={open} onClose={onClose} snapTo="auto">
      <div className="px-5 pb-6 space-y-4">
        {/* Hero image */}
        {landmark.imageUrl && (
          <div className="relative h-48 w-full rounded-2xl overflow-hidden -mx-5 mt-1 w-[calc(100%+40px)]">
            <Image
              src={landmark.imageUrl}
              alt={landmark.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
            {/* Points badge */}
            <div className="absolute top-3 right-3 rounded-2xl bg-[#FFD700]/20 border border-[#FFD700]/40 backdrop-blur-sm px-2.5 py-1 text-xs font-black text-[#FFD700]">
              +{landmark.points} pt
            </div>
          </div>
        )}

        {/* Name & meta */}
        <div>
          <h2 className="text-xl font-black text-white leading-tight">{landmark.name}</h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-white/45">
            <span className="flex items-center gap-1"><MapPin size={11} />{landmark.city ?? "Italia"}</span>
            <span className="flex items-center gap-1">
              <Radar size={11} />
              {withinRadius ? (
                <span className="text-green-400 font-bold">Sei qui!</span>
              ) : (
                formatDistance(distanceMetres)
              )}
            </span>
          </div>
        </div>

        {/* Proximity ring */}
        {!withinRadius && (
          <div>
            <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
              <span>Distanza dal raggio</span>
              <span>{formatDistance(distanceMetres - landmark.radius)} rimanenti</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#FFD700]"
              />
            </div>
          </div>
        )}

        {/* Description */}
        {landmark.description && (
          <p className="text-sm text-white/60 leading-relaxed line-clamp-3">{landmark.description}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {/* TTS */}
          {(landmark.audioUrl || landmark.description) && (
            <VoiceSynthesizer
              text={landmark.description ?? ""}
              audioUrl={landmark.audioUrl}
              landmarkName={landmark.name}
              className="flex-shrink-0"
            />
          )}

          {/* Detail link */}
          <Link
            href={`/landmarks/${landmark.id}`}
            className="flex items-center gap-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 px-3 py-2.5 text-xs font-bold text-white/70 hover:text-white"
          >
            Dettagli <ChevronRight size={12} />
          </Link>
        </div>

        {/* Main CTA */}
        <motion.button
          whileTap={withinRadius && !scanning ? { scale: 0.95 } : {}}
          onClick={onCheckIn}
          disabled={!withinRadius || scanning}
          className={cn(
            "relative w-full overflow-hidden rounded-2xl py-4 text-sm font-black",
            "transition-colors duration-200",
            withinRadius && !scanning
              ? [
                  "bg-[#FFD700] text-slate-950",
                  "shadow-[0_4px_20px_rgba(255,215,0,0.45)]",
                  "before:absolute before:inset-0 before:rounded-2xl before:animate-pulse-glow",
                ]
              : "bg-white/10 backdrop-blur-sm text-white/30 cursor-not-allowed"
          )}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {scanning ? (
              <><Loader2 size={15} className="animate-spin" /> Verifica in corso…</>
            ) : withinRadius ? (
              <><CheckCircle size={15} /> SONO QUI — SCAN NOW</>
            ) : (
              <>Avvicinati ({formatDistance(distanceMetres - landmark.radius)})</>
            )}
          </span>
        </motion.button>

        {/* ── Affiliate partner offers ───────────────────────────── */}
        <div className="h-px bg-white/8 -mx-5" />
        <PartnerWidget landmarkName={landmark.name} city={landmark.city ?? "Barcelona"} />
      </div>
    </BottomSheet>
  );
}

// ── Landmark card (list view) ─────────────────────────────────────────────

function LandmarkCard({
  landmark,
  onOpen,
}: {
  landmark: LandmarkWithDist;
  onOpen: () => void;
}) {
  const withinRadius = landmark.distanceMetres <= landmark.radius;
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-2xl bg-white/4 border border-white/8 overflow-hidden"
    >
      {landmark.imageUrl && (
        <div className="relative h-32 w-full">
          <Image src={landmark.imageUrl} alt={landmark.name} fill className="object-cover" sizes="(max-width: 768px) 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <span className="text-xs font-bold text-white/70">{landmark.city}</span>
            <span className="rounded-full bg-[#FFD700]/18 border border-[#FFD700]/30 px-2 py-0.5 text-xs font-black text-[#FFD700]">
              +{landmark.points} pt
            </span>
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-black text-sm leading-tight">{landmark.name}</h3>
          <div className="flex items-center gap-1 text-xs text-white/45 flex-shrink-0">
            {withinRadius ? <PulseBeacon /> : <MapPin size={11} />}
            <span className={withinRadius ? "text-green-400 font-bold" : ""}>
              {withinRadius ? "Sei qui" : formatDistance(landmark.distanceMetres)}
            </span>
          </div>
        </div>
        <p className="text-xs text-white/45 line-clamp-1">{landmark.description}</p>
      </div>
    </motion.button>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────

export function ScannerView() {
  const { contest } = useContest();
  const { position, isLoading: locLoading, hasError: locError, errorMsg, start } = useUserLocation();
  const { state: scanState, result, checkIn, reset } = useScanner(contest?.id);

  const [nearby, setNearby]     = useState<LandmarkWithDist[]>([]);
  const [selected, setSelected] = useState<LandmarkWithDist | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchNearby = useCallback(async () => {
    if (!position) return;
    setFetching(true);
    try {
      const { landmarks } = await getNearbyLandmarks(position.lat, position.lng, 5000);
      setNearby(landmarks);
    } finally {
      setFetching(false);
    }
  }, [position]);

  useEffect(() => { fetchNearby(); }, [fetchNearby]);

  const openSheet = (lm: LandmarkWithDist) => {
    setSelected(lm);
    setSheetOpen(true);
    reset();
  };

  const handleCheckIn = async () => {
    if (!position || !selected) return;
    await checkIn(selected, position.lat, position.lng);
  };

  // ── GPS error state ───────────────────────────────────────────────────
  if (locError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-black">GPS non disponibile</h2>
        <p className="text-sm text-white/50">{errorMsg}</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={start} className="rounded-2xl bg-[#FFD700] px-6 py-3 font-black text-slate-950 shadow-[0_4px_18px_rgba(255,215,0,0.4)]">
          Riprova
        </motion.button>
      </div>
    );
  }

  // ── Locating ──────────────────────────────────────────────────────────
  if (locLoading || !position) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
        <Loader2 size={40} className="animate-spin text-[#FFD700]" />
        <p className="text-sm font-bold text-white/50">Rilevamento posizione…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-950/95 px-4 pt-header pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <ScanLine className="text-[#FFD700]" size={22} />
          <h1 className="text-xl font-black">Scansiona</h1>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-white/35">
          <PulseBeacon />
          <span>{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</span>
        </div>
      </div>

      {/* Check-in result banner */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={cn(
              "mx-4 mt-4 rounded-2xl p-4 flex items-start gap-3",
              result.success
                ? "bg-green-500/12 border border-green-500/25"
                : "bg-red-500/8 border border-red-500/18"
            )}
          >
            {result.success
              ? <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={18} />
              : <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
            }
            <div className="flex-1">
              <p className="font-bold text-sm">{result.message}</p>
              <p className="text-xs text-white/40 mt-0.5">Distanza: {formatDistance(result.distanceMetres)}</p>
            </div>
            <button onClick={reset} className="text-white/25 hover:text-white/50 text-xs leading-none">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Landmark list */}
      <div className="px-4 pt-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/35">
          Monumenti Vicini ({nearby.length})
        </p>

        {fetching && !nearby.length ? (
          Array.from({ length: 3 }).map((_, i) => <LandmarkCardSkeleton key={i} />)
        ) : nearby.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-white/25">
            <MapPin size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Nessun monumento nelle vicinanze.</p>
            <p className="text-xs mt-1 text-white/20">Esplora la tua città!</p>
          </div>
        ) : (
          nearby.map((lm) => (
            <LandmarkCard key={lm.id} landmark={lm} onOpen={() => openSheet(lm)} />
          ))
        )}
      </div>

      {/* Landmark detail bottom sheet */}
      {selected && (
        <LandmarkSheet
          landmark={selected}
          distanceMetres={selected.distanceMetres}
          open={sheetOpen}
          onClose={() => { setSheetOpen(false); reset(); }}
          scanning={scanState === "checking"}
          onCheckIn={handleCheckIn}
        />
      )}
    </div>
  );
}
