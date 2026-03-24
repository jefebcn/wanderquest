"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserLocation }  from "@/hooks/useUserLocation";
import { useScanner }       from "@/hooks/useScanner";
import { useContest }       from "@/hooks/useContest";
import { getNearbyLandmarks } from "@/actions/landmarks";
import { saveLandmarkPhoto, saveDailyPhoto } from "@/actions/landmark-photos";
import { getFirebaseClient } from "@/lib/firebase/client";
import { formatDistance }   from "@/lib/utils";
import { VoiceSynthesizer } from "@/components/features/voice/VoiceSynthesizer";
import { BottomSheet }      from "@/components/ui/BottomSheet";
import { LandmarkCardSkeleton } from "@/components/ui/Skeleton";
import type { GeoPoint, Landmark } from "@/types";
import type { SaveLandmarkPhotoResult } from "@/actions/landmark-photos";
import {
  ScanLine, MapPin, CheckCircle, AlertCircle, Loader2,
  ChevronRight, Radar, Map, List, Camera, ArrowLeft,
  ImagePlus, Vote,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PartnerWidget }    from "@/components/features/partners/PartnerWidget";
import { TravelConcierge }  from "@/components/features/ai/TravelConcierge";

type LandmarkWithDist = Landmark & { distanceMetres: number };

// Dynamically import Leaflet map to avoid SSR issues
const LiveMapView = dynamic(
  () => import("@/components/features/map/LiveMapView").then((m) => ({ default: m.LiveMapView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-[var(--s-primary)]" />
      </div>
    ),
  }
);

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
  userPosition,
  contestId,
  onPhotoResult,
}: {
  landmark: LandmarkWithDist;
  distanceMetres: number;
  open: boolean;
  onClose: () => void;
  scanning: boolean;
  onCheckIn: () => void;
  userPosition: GeoPoint;
  contestId?: string;
  onPhotoResult: (r: SaveLandmarkPhotoResult) => void;
}) {
  const withinRadius = distanceMetres <= landmark.radius;
  const pct          = Math.min(100, (landmark.radius / Math.max(distanceMetres, 1)) * 100);

  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPhotoUploading(true);
      try {
        const { storage, auth } = getFirebaseClient();
        const { ref: storageRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `landmark_photos/${landmark.id}/${auth.currentUser!.uid}/${Date.now()}_${safeName}`;
        const fileRef2 = storageRef(storage, path);
        await uploadBytes(fileRef2, file);
        const imageUrl = await getDownloadURL(fileRef2);

        const tok = await auth.currentUser?.getIdToken();
        if (!tok) throw new Error("Token mancante");

        // Send live GPS position captured at this exact moment
        const result = await saveLandmarkPhoto(tok, {
          landmarkId: landmark.id,
          userLat: userPosition.lat,
          userLng: userPosition.lng,
          imageUrl,
          storageRef: path,
          caption: "",
          contestId,
        });

        onPhotoResult(result);

        // If server rejected (wrong location), server already deleted the file.
        // Delete client-side reference too as a safety net.
        if (!result.success) {
          const { deleteObject } = await import("firebase/storage");
          await deleteObject(fileRef2).catch(() => {});
        }
      } catch {
        onPhotoResult({ success: false, pointsEarned: 0, message: "Errore durante il caricamento." });
      } finally {
        setPhotoUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [landmark, userPosition, contestId, onPhotoResult]
  );

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
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
            <div className="absolute bottom-3 right-3 rounded-full bg-[var(--s-primary)]/90 px-3 py-1 text-xs font-black text-slate-950">
              +{landmark.points} pt
            </div>
          </div>
        )}

        {/* Name & meta */}
        <div>
          <h2 className="text-xl font-black text-white leading-tight">{landmark.name}</h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-white/45">
            <span className="flex items-center gap-1">
              <MapPin size={11} aria-hidden="true" />{landmark.city ?? "Italia"}
            </span>
            <span className="flex items-center gap-1">
              <Radar size={11} aria-hidden="true" />
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
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>Distanza dal raggio</span>
              <span>{formatDistance(distanceMetres - landmark.radius)} rimanenti</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[var(--s-primary)]"
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
          {(landmark.audioUrl || landmark.description) && (
            <VoiceSynthesizer
              text={landmark.description ?? ""}
              audioUrl={landmark.audioUrl}
              landmarkName={landmark.name}
              className="flex-shrink-0"
            />
          )}
          <Link
            href={`/landmarks/${landmark.id}`}
            className="flex items-center gap-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 px-3 py-2.5 text-xs font-bold text-white/70 hover:text-white"
          >
            Dettagli <ChevronRight size={12} aria-hidden="true" />
          </Link>
        </div>

        {/* Check-in CTA */}
        <motion.button
          whileTap={withinRadius && !scanning ? { scale: 0.95 } : {}}
          onClick={onCheckIn}
          disabled={!withinRadius || scanning}
          className={cn(
            "relative w-full overflow-hidden rounded-2xl py-4 text-sm font-black",
            "transition-colors duration-200",
            withinRadius && !scanning
              ? [
                  "bg-[var(--s-primary)] text-slate-950",
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
              <><CheckCircle size={15} aria-hidden="true" /> SONO QUI — CHECK IN</>
            ) : (
              <>Avvicinati ({formatDistance(distanceMetres - landmark.radius)})</>
            )}
          </span>
        </motion.button>

        {/* Photo upload CTA — only when within radius */}
        {withinRadius && (
          <>
            <div className="h-px bg-white/8 -mx-5" />
            <p className="text-xs text-white/40 text-center">
              Carica una foto qui per guadagnare punti istantaneamente
            </p>
            <motion.button
              whileTap={!photoUploading ? { scale: 0.97 } : {}}
              onClick={() => fileRef.current?.click()}
              disabled={photoUploading}
              className={cn(
                "w-full rounded-2xl border py-3.5 text-sm font-black flex items-center justify-center gap-2",
                "transition-colors duration-200",
                photoUploading
                  ? "border-white/10 bg-white/5 text-white/30 cursor-not-allowed"
                  : "border-[var(--s-primary)]/35 bg-[var(--s-primary)]/10 text-[var(--s-primary)] hover:bg-[var(--s-primary)]/15"
              )}
            >
              {photoUploading ? (
                <><Loader2 size={14} className="animate-spin" /> Verifica GPS…</>
              ) : (
                <><Camera size={14} aria-hidden="true" /> Carica Foto · +{landmark.points} pt</>
              )}
            </motion.button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </>
        )}

        {/* Affiliate partner offers */}
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
            <span className="rounded-full bg-[var(--s-primary)]/18 border border-[var(--s-primary)]/30 px-2 py-0.5 text-xs font-black text-[var(--s-primary)]">
              +{landmark.points} pt
            </span>
          </div>
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-black text-sm leading-tight">{landmark.name}</h3>
          <div className="flex items-center gap-1 text-xs text-white/45 flex-shrink-0">
            {withinRadius ? <PulseBeacon /> : <MapPin size={11} aria-hidden="true" />}
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

// ── Daily Activities (shown when no nearby monuments) ─────────────────────

function DailyActivities({
  userPosition,
  contestId,
  onResult,
}: {
  userPosition: GeoPoint;
  contestId?: string;
  onResult: (r: SaveLandmarkPhotoResult) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const { storage, auth } = getFirebaseClient();
        const { ref: storageRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `daily_photos/${auth.currentUser!.uid}/${Date.now()}_${safeName}`;
        const fileRef2 = storageRef(storage, path);
        await uploadBytes(fileRef2, file);
        const imageUrl = await getDownloadURL(fileRef2);
        const tok = await auth.currentUser?.getIdToken();
        if (!tok) throw new Error("Token mancante");
        const result = await saveDailyPhoto(tok, {
          userLat: userPosition.lat,
          userLng: userPosition.lng,
          imageUrl,
          storageRef: path,
          contestId,
        });
        onResult(result);
        if (!result.success) {
          const { deleteObject } = await import("firebase/storage");
          await deleteObject(fileRef2).catch(() => {});
        }
      } catch {
        onResult({ success: false, pointsEarned: 0, message: "Errore durante il caricamento." });
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [userPosition, contestId, onResult]
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
        Sfide Disponibili
      </p>

      {/* Daily location photo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/4 border border-white/8 p-4"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="size-10 rounded-xl bg-[var(--s-accent)]/15 border border-[var(--s-accent)]/25 flex items-center justify-center flex-shrink-0">
            <ImagePlus size={18} className="text-[var(--s-accent)]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-white">Foto del Luogo</p>
            <p className="text-xs text-white/45 mt-0.5">Scatta una foto dei tuoi dintorni e guadagna punti</p>
          </div>
          <span className="rounded-full bg-[var(--s-accent)]/15 border border-[var(--s-accent)]/25 px-2.5 py-1 text-xs font-black text-[var(--s-accent)] flex-shrink-0">
            +50 pt
          </span>
        </div>
        <p className="text-[10px] text-white/25 mb-3">1 volta al giorno · entra nel contest per i voti</p>
        <motion.button
          whileTap={!uploading ? { scale: 0.97 } : {}}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full rounded-xl py-2.5 text-sm font-black flex items-center justify-center gap-2 transition-colors duration-150",
            uploading
              ? "bg-white/5 text-white/30 cursor-not-allowed"
              : "bg-[var(--s-accent)]/15 border border-[var(--s-accent)]/30 text-[var(--s-accent)] hover:bg-[var(--s-accent)]/22"
          )}
        >
          {uploading
            ? <><Loader2 size={14} className="animate-spin" /> Caricamento…</>
            : <><Camera size={14} aria-hidden="true" /> Scatta Foto</>
          }
        </motion.button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
      </motion.div>

      {/* Vote on contest photos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Link
          href="/scan"
          className="flex items-center gap-3 rounded-2xl bg-white/4 border border-white/8 p-4 hover:bg-white/6 transition-colors duration-150"
        >
          <div className="size-10 rounded-xl bg-[var(--s-primary)]/15 border border-[var(--s-primary)]/25 flex items-center justify-center flex-shrink-0">
            <Vote size={18} className="text-[var(--s-primary)]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-white">Vota le Foto</p>
            <p className="text-xs text-white/45 mt-0.5">Guadagna 1–3 pt per ogni voto sulle foto degli altri esploratori</p>
          </div>
          <ChevronRight size={16} className="text-white/30 flex-shrink-0" aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────

export function ScannerView() {
  const router = useRouter();
  const { contest } = useContest();
  const { position, isLoading: locLoading, hasError: locError, errorMsg, start } = useUserLocation();
  const { state: scanState, result, checkIn, reset } = useScanner(contest?.id);

  const [nearby, setNearby]         = useState<LandmarkWithDist[]>([]);
  const [selected, setSelected]     = useState<LandmarkWithDist | null>(null);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [fetching, setFetching]     = useState(false);
  const [view, setView]             = useState<"map" | "list">("map");
  const [photoResult, setPhotoResult] = useState<SaveLandmarkPhotoResult | null>(null);

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
    setPhotoResult(null);
  };

  const handleCheckIn = async () => {
    if (!position || !selected) return;
    await checkIn(selected, position.lat, position.lng);
  };

  const handlePhotoResult = useCallback((r: SaveLandmarkPhotoResult) => {
    setPhotoResult(r);
    if (r.success) fetchNearby();
  }, [fetchNearby]);

  // ── GPS error ─────────────────────────────────────────────────────────
  if (locError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-black">GPS non disponibile</h2>
        <p className="text-sm text-white/50">{errorMsg}</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={start} className="rounded-2xl bg-[var(--s-primary)] px-6 py-3 font-black text-slate-950 shadow-[0_4px_18px_rgba(255,215,0,0.4)]">
          Riprova
        </motion.button>
      </div>
    );
  }

  // ── Locating ──────────────────────────────────────────────────────────
  if (locLoading || !position) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
        <Loader2 size={40} className="animate-spin text-[var(--s-primary)]" />
        <p className="text-sm font-bold text-white/50">Rilevamento posizione…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-950/95 px-4 pt-header pb-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="mr-1 -ml-1 rounded-xl p-1.5 text-white/50 hover:text-white hover:bg-white/8 transition-colors duration-150"
            aria-label="Torna indietro"
          >
            <ArrowLeft size={20} />
          </button>
          <ScanLine className="text-[var(--s-primary)]" size={22} aria-hidden="true" />
          <h1 className="text-xl font-black">Esplora</h1>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-white/35">
          <PulseBeacon />
          <span>{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</span>
        </div>

        {/* Map / List toggle */}
        <div className="flex rounded-xl bg-white/8 p-0.5 mt-3">
          <button
            onClick={() => setView("map")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-colors duration-150",
              view === "map" ? "bg-white/15 text-white" : "text-white/40"
            )}
          >
            <Map size={12} aria-hidden="true" /> Mappa
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-colors duration-150",
              view === "list" ? "bg-white/15 text-white" : "text-white/40"
            )}
          >
            <List size={12} aria-hidden="true" /> Lista ({nearby.length})
          </button>
        </div>
      </div>

      {/* Check-in / photo result banner */}
      <AnimatePresence>
        {(result || photoResult) && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={cn(
              "mx-4 mt-4 rounded-2xl p-4 flex items-start gap-3",
              (result?.success || photoResult?.success)
                ? "bg-green-500/12 border border-green-500/25"
                : "bg-red-500/8 border border-red-500/18"
            )}
          >
            {(result?.success || photoResult?.success)
              ? <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={18} aria-hidden="true" />
              : <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={18} aria-hidden="true" />
            }
            <div className="flex-1">
              <p className="font-bold text-sm">{photoResult?.message ?? result?.message}</p>
              {result && (
                <p className="text-xs text-white/40 mt-0.5">Distanza: {formatDistance(result.distanceMetres)}</p>
              )}
            </div>
            <button
              onClick={() => { reset(); setPhotoResult(null); }}
              className="text-white/25 hover:text-white/50 text-xs leading-none"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map view */}
      {view === "map" && (
        <div className="relative" style={{ height: "calc(100vh - 148px)" }}>
          <LiveMapView
            position={position}
            landmarks={nearby}
            onLandmarkSelect={openSheet}
          />
          {nearby.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] rounded-full bg-slate-900/90 border border-white/15 backdrop-blur-md px-4 py-2 text-xs font-bold text-white/70 pointer-events-none">
              {nearby.length} monumento{nearby.length !== 1 ? "i" : ""} vicin{nearby.length !== 1 ? "i" : "o"}
            </div>
          )}

          {/* Floating activities panel when no landmarks nearby */}
          {!fetching && nearby.length === 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-[400] px-4 pb-6 pt-12 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
              <DailyActivities
                userPosition={position}
                contestId={contest?.id}
                onResult={handlePhotoResult}
              />
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="px-4 pt-4 pb-24 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-white/35">
            Monumenti Vicini ({nearby.length})
          </p>
          {fetching && !nearby.length ? (
            Array.from({ length: 3 }).map((_, i) => <LandmarkCardSkeleton key={i} />)
          ) : nearby.length === 0 ? (
            <DailyActivities
              userPosition={position}
              contestId={contest?.id}
              onResult={handlePhotoResult}
            />
          ) : (
            nearby.map((lm) => (
              <LandmarkCard key={lm.id} landmark={lm} onOpen={() => openSheet(lm)} />
            ))
          )}
        </div>
      )}

      {/* Landmark detail bottom sheet */}
      {selected && (
        <LandmarkSheet
          landmark={selected}
          distanceMetres={selected.distanceMetres}
          open={sheetOpen}
          onClose={() => { setSheetOpen(false); reset(); setPhotoResult(null); }}
          scanning={scanState === "checking"}
          onCheckIn={handleCheckIn}
          userPosition={position}
          contestId={contest?.id}
          onPhotoResult={handlePhotoResult}
        />
      )}

      {/* AI Travel Concierge floating button */}
      <TravelConcierge ctx={{ lat: position.lat, lng: position.lng }} />
    </div>
  );
}
