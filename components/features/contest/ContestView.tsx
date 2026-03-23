"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useTransition,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useContest } from "@/hooks/useContest";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { getFirebaseClient } from "@/lib/firebase/client";
import { submitVote, saveContestPhoto, getMyPhotos, getContestPhotos, markPhotosAsSeen } from "@/actions/contest-photos";
import { formatCents } from "@/lib/utils";
import type { ContestPhoto, VoteType } from "@/types";
import {
  Heart,
  X,
  Star,
  Camera,
  Upload,
  ImageIcon,
  Trophy,
  Sparkles,
  ChevronLeft,
  MapPin,
  Lock,
  Loader2,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

// ── Prize tiers ───────────────────────────────────────────────────────────

const PRIZE_TIERS = [
  { rank: 1, emoji: "🥇", label: "1° posto", amount: "€200", color: "border-[var(--s-primary)]/40 bg-[var(--s-primary)]/8", textColor: "text-[var(--s-primary)]" },
  { rank: 2, emoji: "🥈", label: "2° posto", amount: "€100", color: "border-white/15 bg-white/[0.04]",   textColor: "text-white/70" },
  { rank: 3, emoji: "🥉", label: "3° posto", amount: "€50",  color: "border-amber-700/30 bg-amber-900/10", textColor: "text-amber-400/80" },
] as const;

function PrizeTierBanner() {
  return (
    <div className="mx-4 my-3">
      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Premi mensili</p>
      <div className="grid grid-cols-3 gap-2">
        {PRIZE_TIERS.map(({ rank, emoji, label, amount, color, textColor }) => (
          <motion.div
            key={rank}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.07 }}
            className={`rounded-xl border p-3 text-center ${color}`}
          >
            <p className="text-xl mb-1">{emoji}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">{label}</p>
            <p className={`text-base font-black ${textColor}`}>{amount}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Voting hint ────────────────────────────────────────────────────────────

function VotingHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mx-4 mb-3 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2.5">Come votare</p>
      <div className="grid grid-cols-3 gap-0 text-center divide-x divide-white/8">
        <div className="px-2">
          <p className="text-base mb-1">←</p>
          <p className="text-xs font-bold text-red-400/80">Salta</p>
          <p className="text-xs text-white/30">Scorri sx</p>
        </div>
        <div className="px-2">
          <p className="text-base mb-1">↑</p>
          <p className="text-xs font-bold text-[var(--s-primary)]">Super Like</p>
          <p className="text-xs text-[var(--s-primary)]/50">+3 pt</p>
        </div>
        <div className="px-2">
          <p className="text-base mb-1">→</p>
          <p className="text-xs font-bold text-green-400/80">Like</p>
          <p className="text-xs text-white/30">Scorri dx</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Mock photos (shown while Firestore loads or in dev) ───────────────────

const AVATAR_GRADIENTS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-green-500 to-emerald-500",
  "from-red-500 to-rose-500",
  "from-indigo-500 to-blue-500",
];

const MOCK_PHOTOS: ContestPhoto[] = [
  {
    id: "m1",
    userId: "u1",
    displayName: "Sofia Rossi",
    initials: "SR",
    avatarGradient: AVATAR_GRADIENTS[0],
    imageUrl: "https://images.unsplash.com/photo-1583779457094-efcd1a8ca25a?w=700&q=80",
    caption: "Tramonto mozzafiato sulla Sagrada Família 🌅 La luce dorata era magica!",
    city: "Barcellona",
    likes: 234,
    superLikes: 45,
    skips: 12,
    contestId: "demo",
    uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "m2",
    userId: "u2",
    displayName: "Marco Bianchi",
    initials: "MB",
    avatarGradient: AVATAR_GRADIENTS[1],
    imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=700&q=80",
    caption: "Park Güell al mattino presto — solo io e la città 🏙️",
    city: "Barcellona",
    likes: 189,
    superLikes: 31,
    skips: 20,
    contestId: "demo",
    uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "m3",
    userId: "u3",
    displayName: "Lucia García",
    initials: "LG",
    avatarGradient: AVATAR_GRADIENTS[2],
    imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=700&q=80",
    caption: "Casa Batlló di notte: pura magia architettonica ✨",
    city: "Barcellona",
    likes: 312,
    superLikes: 78,
    skips: 8,
    contestId: "demo",
    uploadedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "m4",
    userId: "u4",
    displayName: "Luca Ferrari",
    initials: "LF",
    avatarGradient: AVATAR_GRADIENTS[3],
    imageUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=700&q=80",
    caption: "Colosseo all'alba — niente turisti, solo storia 🏛️",
    city: "Roma",
    likes: 156,
    superLikes: 29,
    skips: 15,
    contestId: "demo",
    uploadedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: "m5",
    userId: "u5",
    displayName: "Elena López",
    initials: "EL",
    avatarGradient: AVATAR_GRADIENTS[4],
    imageUrl: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=700&q=80",
    caption: "Torre Eiffel al tramonto — la città della luce! 🗼",
    city: "Parigi",
    likes: 421,
    superLikes: 95,
    skips: 5,
    contestId: "demo",
    uploadedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "m6",
    userId: "u6",
    displayName: "Filippo Conte",
    initials: "FC",
    avatarGradient: AVATAR_GRADIENTS[5],
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=700&q=80",
    caption: "Il Colosseo sotto la pioggia — atmosfera unica 🌧️",
    city: "Roma",
    likes: 98,
    superLikes: 14,
    skips: 31,
    contestId: "demo",
    uploadedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
];

// ── Avatar ────────────────────────────────────────────────────────────────

function Avatar({ photo, size = 32 }: { photo: ContestPhoto; size?: number }) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-black overflow-hidden flex-shrink-0",
        `bg-gradient-to-br ${photo.avatarGradient}`,
      )}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {photo.initials}
    </div>
  );
}

// ── Swipe Indicator ───────────────────────────────────────────────────────

function SwipeIndicator({
  label,
  color,
  rotation,
  style,
  opacity,
}: {
  label: string;
  color: string;
  rotation: string;
  style?: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opacity: any;
}) {
  return (
    <motion.div
      style={{ ...style, opacity }}
      className={cn("absolute z-20 pointer-events-none select-none", rotation)}
    >
      <div
        className={cn(
          "rounded-xl border-[3px] px-4 py-1.5 text-xl font-black tracking-wider",
          color,
        )}
      >
        {label}
      </div>
    </motion.div>
  );
}

// ── Swipeable Card ────────────────────────────────────────────────────────

function SwipeCard({
  photo,
  isTop,
  stackOffset,
  onVote,
}: {
  photo: ContestPhoto;
  isTop: boolean;
  stackOffset: number; // 0 = top, 1 = second, 2 = third
  onVote: (type: VoteType) => void;
}) {
  const x      = useMotionValue(0);
  const y      = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);

  // Indicator opacities
  const likeOpacity  = useTransform(x, [20, 90], [0, 1]);
  const nopeOpacity  = useTransform(x, [-20, -90], [0, 1]);
  const superOpacity = useTransform(y, [-20, -90], [0, 1]);

  const handleDragEnd = useCallback(
    async (_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
      const { offset, velocity } = info;
      const isRight  = offset.x > 100  || velocity.x > 450;
      const isLeft   = offset.x < -100 || velocity.x < -450;
      const isUp     = offset.y < -90  || velocity.y < -450;

      if (isRight) {
        await animate(x, 900, { duration: 0.32, ease: "easeOut" });
        onVote("like");
      } else if (isLeft) {
        await animate(x, -900, { duration: 0.32, ease: "easeOut" });
        onVote("skip");
      } else if (isUp) {
        await animate(y, -900, { duration: 0.32, ease: "easeOut" });
        onVote("superlike");
      } else {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
        animate(y, 0, { type: "spring", stiffness: 500, damping: 40 });
      }
    },
    [x, y, onVote],
  );

  // Non-top cards: static stack peeks (not draggable)
  if (!isTop) {
    const scale = 1 - stackOffset * 0.04;
    const translateY = stackOffset * 10;
    return (
      <motion.div
        initial={false}
        animate={{ scale, y: translateY, opacity: 1 - stackOffset * 0.15 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
        style={{ transformOrigin: "bottom center" }}
      >
        <div className="h-full w-full bg-slate-800 rounded-3xl" />
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.18}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, touchAction: "none" }}
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing shadow-2xl"
      whileTap={{ scale: 1.02 }}
    >
      {/* Photo */}
      <Image
        src={photo.imageUrl}
        alt={photo.caption}
        fill
        className="object-cover pointer-events-none"
        sizes="100vw"
        priority
        draggable={false}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/15 to-transparent pointer-events-none" />
      {/* Side tint overlays */}
      <motion.div
        style={{ opacity: useTransform(x, [0, 100], [0, 0.35]) }}
        className="absolute inset-0 bg-green-500 pointer-events-none rounded-3xl"
      />
      <motion.div
        style={{ opacity: useTransform(x, [-100, 0], [0.35, 0]) }}
        className="absolute inset-0 bg-red-500 pointer-events-none rounded-3xl"
      />
      <motion.div
        style={{ opacity: useTransform(y, [-100, 0], [0.35, 0]) }}
        className="absolute inset-0 bg-[var(--s-primary)] pointer-events-none rounded-3xl"
      />

      {/* Swipe indicators */}
      <SwipeIndicator
        label="LIKE"
        color="border-green-400 text-green-400"
        rotation="-rotate-[20deg]"
        style={{ top: "10%", left: "6%" }}
        opacity={likeOpacity}
      />
      <SwipeIndicator
        label="NOPE"
        color="border-red-400 text-red-400"
        rotation="rotate-[20deg]"
        style={{ top: "10%", right: "6%" }}
        opacity={nopeOpacity}
      />
      <SwipeIndicator
        label="SUPER"
        color="border-[var(--s-primary)] text-[var(--s-primary)]"
        rotation=""
        style={{ top: "10%", left: "50%", transform: "translateX(-50%)" }}
        opacity={superOpacity}
      />

      {/* Points badge */}
      <div className="absolute top-4 right-4 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 px-3 py-1">
        <span className="text-xs font-black text-[var(--s-primary)]">
          {photo.likes + photo.superLikes * 3} pt
        </span>
      </div>

      {/* User info + caption */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Avatar photo={photo} size={36} />
          <div>
            <p className="text-sm font-black text-white leading-tight">{photo.displayName}</p>
            {photo.city && (
              <p className="text-xs text-white/50 flex items-center gap-1">
                <MapPin size={9} />{photo.city}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-white/80 leading-snug">{photo.caption}</p>

        {/* Vote stats */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-green-400/70 flex items-center gap-1">
            <Heart size={9} fill="currentColor" />{photo.likes}
          </span>
          <span className="text-xs text-[var(--s-primary)]/70 flex items-center gap-1">
            <Star size={9} fill="currentColor" />{photo.superLikes}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Action Buttons ────────────────────────────────────────────────────────

function ActionButtons({
  onSkip,
  onSuperLike,
  onLike,
  disabled,
}: {
  onSkip: () => void;
  onSuperLike: () => void;
  onLike: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-5 py-5">
      {/* Skip */}
      <motion.button
        whileTap={!disabled ? { scale: 0.88 } : {}}
        onClick={onSkip}
        disabled={disabled}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-opacity",
          "border-red-400/60 bg-red-500/10",
          disabled && "opacity-30 cursor-not-allowed",
        )}
      >
        <X size={24} className="text-red-400" />
      </motion.button>

      {/* Super Like */}
      <motion.button
        whileTap={!disabled ? { scale: 0.88 } : {}}
        onClick={onSuperLike}
        disabled={disabled}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-xl transition-opacity",
          "border-[var(--s-primary)]/70 bg-[var(--s-primary)]/12",
          "shadow-[0_4px_24px_rgba(255,215,0,0.25)]",
          disabled && "opacity-30 cursor-not-allowed",
        )}
      >
        <Star size={28} className="text-[var(--s-primary)]" fill="currentColor" />
      </motion.button>

      {/* Like */}
      <motion.button
        whileTap={!disabled ? { scale: 0.88 } : {}}
        onClick={onLike}
        disabled={disabled}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-opacity",
          "border-green-400/60 bg-green-500/10",
          disabled && "opacity-30 cursor-not-allowed",
        )}
      >
        <Heart size={24} className="text-green-400" fill="currentColor" />
      </motion.button>
    </div>
  );
}

// ── My Photos tab ─────────────────────────────────────────────────────────

const VOTE_THRESHOLDS = [50, 100, 200, 500, 1000];
function getNextThreshold(likes: number): number {
  return VOTE_THRESHOLDS.find(t => t > likes) ?? likes * 2;
}

function MyPhotosTab({
  photos,
  loading,
  onUpload,
}: {
  photos: ContestPhoto[];
  loading: boolean;
  onUpload: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[var(--s-primary)]/50" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {/* Upload CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onUpload}
        className="w-full mb-4 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--s-primary)]/30 bg-[var(--s-primary)]/5 py-5 text-sm font-black text-[var(--s-primary)]/70 hover:bg-[var(--s-primary)]/8 transition-colors"
      >
        <Camera size={20} className="text-[var(--s-primary)]/50" />
        Carica una nuova foto
      </motion.button>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center text-white/25">
          <ImageIcon size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Nessuna foto caricata.</p>
          <p className="text-xs mt-1 text-white/20">Carica la tua prima foto per partecipare!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, i) => {
            const thresh = getNextThreshold(photo.likes);
            const pct = Math.min((photo.likes / thresh) * 100, 100);
            const remaining = thresh - photo.likes;
            return (
              <div key={photo.id} className="flex flex-col gap-1.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative rounded-2xl overflow-hidden aspect-[3/4]"
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs text-white/70 line-clamp-2 mb-1">{photo.caption}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-400 flex items-center gap-0.5">
                        <Heart size={8} fill="currentColor" />{photo.likes}
                      </span>
                      <span className="text-xs text-[var(--s-primary)] flex items-center gap-0.5">
                        <Star size={8} fill="currentColor" />{photo.superLikes}
                      </span>
                      <span className="text-xs text-white/40 ml-auto font-black">
                        {photo.likes + photo.superLikes * 3}pt
                      </span>
                    </div>
                  </div>
                </motion.div>
                {/* Progress to next like threshold */}
                <div className="px-0.5">
                  <p className="text-[10px] text-white/30 mb-0.5">{remaining} like per salire</p>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--s-primary)] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Upload Sheet ──────────────────────────────────────────────────────────

function UploadSheet({
  open,
  onClose,
  onSubmit,
  submitting,
  uploadError,
  hasContest,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File, caption: string, city: string) => void;
  submitting: boolean;
  uploadError?: string | null;
  hasContest: boolean;
}) {
  const [preview, setPreview]   = useState<string | null>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [caption, setCaption]   = useState("");
  const [city, setCity]         = useState("");
  const fileInputRef            = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Validate file size (max 10 MB)
    if (f.size > 10 * 1024 * 1024) {
      alert("Foto troppo grande. Massimo 10 MB.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setPreview(null); setFile(null); setCaption(""); setCity("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!file || !caption.trim()) return;
    onSubmit(file, caption.trim(), city.trim());
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="upload-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div
            key="upload-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[30px] bg-slate-900 border-t border-white/12 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="h-1 w-10 rounded-full bg-white/25" />
            </div>

            <div className="px-5 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Carica foto</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/50"
                >
                  <X size={15} />
                </motion.button>
              </div>

              {/* Photo picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-52 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-white/4 hover:bg-white/6 transition-colors"
              >
                {preview ? (
                  <Image src={preview} alt="Preview" fill className="object-cover rounded-2xl" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/30">
                    <Camera size={36} />
                    <p className="text-sm font-bold">Scatta o scegli dalla galleria</p>
                    <p className="text-xs">JPG, PNG, WEBP — max 10 MB</p>
                  </div>
                )}
                {preview && (
                  <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-xs font-bold text-white">Cambia foto</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/*"
                className="hidden"
                onChange={handleFile}
              />

              {/* Caption */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5 block">
                  Didascalia *
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Racconta qualcosa su questo posto…"
                  maxLength={140}
                  rows={3}
                  className="w-full rounded-xl bg-white/6 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 resize-none"
                />
                <p className="text-xs text-white/25 text-right mt-1">{caption.length}/140</p>
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5 block">
                  Città (opzionale)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="es. Barcellona"
                  className="w-full rounded-xl bg-white/6 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* No active contest warning */}
              {!hasContest && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/12 border border-amber-500/25 px-4 py-3">
                  <X size={14} className="text-amber-400 flex-shrink-0" />
                  <p className="text-[12px] text-amber-300">Nessun contest attivo al momento. Riprova più tardi.</p>
                </div>
              )}

              {/* Error message */}
              {uploadError && hasContest && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/12 border border-red-500/25 px-4 py-3">
                  <X size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-[12px] text-red-300">{uploadError}</p>
                </div>
              )}

              {/* Submit */}
              <motion.button
                whileTap={file && caption.trim() && !submitting && hasContest ? { scale: 0.97 } : {}}
                onClick={handleSubmit}
                disabled={!file || !caption.trim() || submitting || !hasContest}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-colors min-h-[52px]",
                  file && caption.trim() && !submitting && hasContest
                    ? "bg-[var(--s-primary)] text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.30)]"
                    : "bg-white/10 text-white/30 cursor-not-allowed",
                )}
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Caricamento…</>
                ) : (
                  <><Upload size={16} /> Pubblica nel contest</>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Vote deck ─────────────────────────────────────────────────────────────

function VoteDeck({
  photos,
  contestId,
  onVoteSubmitted,
}: {
  photos: ContestPhoto[];
  contestId?: string;
  onVoteSubmitted: (total: number) => void;
}) {
  const { user } = useAuth();
  const [queue, setQueue]   = useState<ContestPhoto[]>(photos);
  const [votedCount, setVotedCount] = useState(0);
  const [pending, startTransition]  = useTransition();

  // Sync queue when photos prop changes (after load)
  useEffect(() => { setQueue(photos); }, [photos]);

  const top   = queue[0];
  const next  = queue[1];
  const third = queue[2];

  const handleVote = useCallback(
    (type: VoteType) => {
      const photo = queue[0];
      if (!photo) return;

      // Optimistic remove from queue
      setQueue((q) => q.slice(1));
      const newTotal = votedCount + 1;
      setVotedCount(newTotal);
      onVoteSubmitted(newTotal);

      // Persist to Firestore (fire and forget)
      if (user && contestId && !photo.id.startsWith("m")) {
        startTransition(async () => {
          const { auth } = getFirebaseClient();
          const tok = await auth.currentUser?.getIdToken();
          if (tok) {
            submitVote(tok, photo.id, contestId, type).catch(() => {});
            markPhotosAsSeen(tok, [photo.id], contestId).catch(() => {});
          }
        });
      }
    },
    [queue, user, contestId, votedCount, onVoteSubmitted],
  );

  if (queue.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-16 text-center px-8"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--s-primary)]/10 border border-[var(--s-primary)]/20 mb-2">
          <CheckCircle2 size={36} className="text-[var(--s-primary)]" />
        </div>
        <h3 className="text-xl font-black text-white">Hai votato tutto!</h3>
        <p className="text-sm text-white/45 leading-relaxed max-w-[240px]">
          Torna più tardi per votare le nuove foto. Nel frattempo carica la tua!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Card stack */}
      <div className="relative mx-4 w-[calc(100%-2rem)]" style={{ height: "58svh", maxHeight: 520 }}>
        <AnimatePresence>
          {third && (
            <SwipeCard
              key={third.id + "-bg2"}
              photo={third}
              isTop={false}
              stackOffset={2}
              onVote={() => {}}
            />
          )}
          {next && (
            <SwipeCard
              key={next.id + "-bg1"}
              photo={next}
              isTop={false}
              stackOffset={1}
              onVote={() => {}}
            />
          )}
          {top && (
            <SwipeCard
              key={top.id}
              photo={top}
              isTop={true}
              stackOffset={0}
              onVote={handleVote}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Hint text */}
      <p className="text-xs text-white/25 mt-3 mb-1">
        ← Skip &nbsp;|&nbsp; ↑ Super Like &nbsp;|&nbsp; Like →
      </p>

      {/* Action buttons */}
      <ActionButtons
        disabled={!top || pending}
        onSkip={() => {
          const photo = queue[0];
          if (photo) { animate(/* just trigger from the card */ 0, 0); handleVote("skip"); }
        }}
        onSuperLike={() => handleVote("superlike")}
        onLike={() => handleVote("like")}
      />

      {/* Vote counter */}
      {votedCount > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-white/30 mt-1"
        >
          {votedCount} vot{votedCount === 1 ? "o" : "i"} questa sessione · {queue.length} foto rimanenti
        </motion.p>
      )}
    </div>
  );
}

// ── Locked state ──────────────────────────────────────────────────────────

function LockedContest({ prizePool, onSignIn }: { prizePool?: number; onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="flex flex-col items-center"
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-500/12 border border-purple-500/22 mb-5"
          style={{ boxShadow: "0 0 40px rgba(139,92,246,0.15)" }}
        >
          <Lock size={34} className="text-purple-400" />
        </div>
        {prizePool !== undefined && (
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--s-primary)]/10 border border-[var(--s-primary)]/20 px-3 py-1 mb-4">
            <Sparkles size={11} className="text-[var(--s-primary)]" />
            <span className="text-xs font-black text-[var(--s-primary)]">{formatCents(prizePool)} in palio</span>
          </div>
        )}
        <h2 className="text-2xl font-black text-white mb-2">Contest bloccato</h2>
        <p className="text-sm text-white/45 leading-relaxed max-w-[270px] mb-7">
          Accedi per votare le foto degli altri esploratori e caricare le tue per scalare la classifica.
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onSignIn}
          className="flex items-center gap-2 rounded-2xl bg-[var(--s-primary)] px-6 py-3.5 text-sm font-black text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.32)] hover:bg-yellow-300 transition-colors min-h-[48px]"
        >
          <Heart size={16} />
          Accedi e vota
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Main ContestView ──────────────────────────────────────────────────────

type Tab = "vote" | "mine";

export function ContestView() {
  const { user, loading: authLoading } = useAuth();
  const { contest, timeLeft, loading: contestLoading } = useContest();
  const [authOpen, setAuthOpen]        = useState(false);
  const [tab, setTab]                  = useState<Tab>("vote");
  const [uploadOpen, setUploadOpen]    = useState(false);
  const [submitting, setSubmitting]    = useState(false);
  const [uploadDone, setUploadDone]    = useState(false);
  const [uploadError, setUploadError]  = useState<string | null>(null);
  const [myPhotos, setMyPhotos]        = useState<ContestPhoto[]>([]);
  const [myPhotosLoading, setMyPhotosLoading] = useState(false);
  const [totalVoted, setTotalVoted]    = useState(0);
  const [contestPhotos, setContestPhotos] = useState<ContestPhoto[]>([]);
  const [contestPhotosLoading, setContestPhotosLoading] = useState(false);
  const skipNextMyPhotosLoad = useRef(false);

  // Load contest photos for voting when user + contest are ready
  useEffect(() => {
    if (!user || !contest) return;
    setContestPhotosLoading(true);
    (async () => {
      try {
        const { auth } = getFirebaseClient();
        const tok = await auth.currentUser?.getIdToken();
        if (tok) {
          const { photos } = await getContestPhotos(tok, contest.id);
          setContestPhotos(photos.length > 0 ? photos : []);
        }
      } catch {
        // On error show mock photos so the UI is not empty for demo
        setContestPhotos(MOCK_PHOTOS);
      } finally {
        setContestPhotosLoading(false);
      }
    })();
  }, [user, contest]);

  // Load my photos when tab switches to "mine"
  useEffect(() => {
    if (tab !== "mine" || !user || !contest) return;
    if (skipNextMyPhotosLoad.current) {
      skipNextMyPhotosLoad.current = false;
      return;
    }
    setMyPhotosLoading(true);
    (async () => {
      try {
        const { auth } = getFirebaseClient();
        const tok = await auth.currentUser?.getIdToken();
        if (tok) {
          const { photos } = await getMyPhotos(tok, contest.id);
          setMyPhotos(photos);
        }
      } catch {
        // Fallback: empty
      } finally {
        setMyPhotosLoading(false);
      }
    })();
  }, [tab, user, contest]);

  const handleUploadSubmit = async (file: File, caption: string, city: string) => {
    if (!user) {
      setUploadError("Devi effettuare il login per caricare una foto.");
      return;
    }
    if (!contest) {
      setUploadError("Nessun contest attivo al momento. Riprova più tardi.");
      return;
    }
    setUploadError(null);
    setSubmitting(true);
    try {
      const { storage, auth } = getFirebaseClient();
      // Upload image to Firebase Storage
      const { ref: storageRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `contest_photos/${contest.id}/${user.uid}/${Date.now()}_${safeName}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const imageUrl = await getDownloadURL(fileRef);

      // Save metadata via server action
      const tok = await auth.currentUser?.getIdToken();
      if (!tok) throw new Error("Token non disponibile");
      await saveContestPhoto(tok, contest.id, imageUrl, caption, city);

      setUploadDone(true);
      setUploadOpen(false);
      // Always refresh my photos after upload and switch to "mine" tab
      const tokRefresh = await auth.currentUser?.getIdToken();
      if (tokRefresh) {
        const { photos } = await getMyPhotos(tokRefresh, contest.id);
        setMyPhotos(photos);
      }
      skipNextMyPhotosLoad.current = true;
      setTab("mine");
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Errore durante il caricamento. Controlla la connessione e riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--s-primary)]/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-28">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-white/8">
        <div className="px-4 pt-14 pb-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--s-primary)]/15 border border-[var(--s-primary)]/25">
                <Trophy className="text-[var(--s-primary)]" size={16} />
              </div>
              <div>
                <h1 className="text-xl font-black leading-tight">
                  {contest?.title ?? "Photo Contest"}
                </h1>
                <p className="text-xs text-white/35 font-medium">
                  {contest?.prizePool && contest.prizePool > 0
                    ? "Carica foto — vota — vinci premi reali"
                    : "Carica foto — vota — condividi i tuoi viaggi"}
                </p>
              </div>
            </div>
            {contest && contest.prizePool > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="flex items-center gap-1 rounded-full bg-[var(--s-primary)]/12 border border-[var(--s-primary)]/25 px-2.5 py-1 text-xs font-black text-[var(--s-primary)]">
                  <Sparkles size={9} />{formatCents(contest.prizePool)} in palio
                </span>
                {timeLeft && timeLeft !== "Terminato" && contest.id !== "general" && (
                  <span className="flex items-center gap-1 rounded-full bg-white/6 border border-white/10 px-2.5 py-1 text-xs text-white/45">
                    ⏱ Scade in {timeLeft}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Upload FAB on header */}
          {user && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setUploadOpen(true)}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-[var(--s-primary)] px-3 py-2 text-xs font-black text-slate-900 shadow-[0_3px_16px_rgba(255,215,0,0.30)] min-h-[36px]"
            >
              <Camera size={14} />
              Carica
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        {user && (
          <div className="flex gap-0 px-4 pb-0">
            {([
              { id: "vote" as Tab, label: "Vota", icon: Heart },
              { id: "mine" as Tab, label: "Le mie foto", icon: ImageIcon },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-black transition-colors",
                  tab === id ? "text-[var(--s-primary)]" : "text-white/35",
                )}
              >
                <Icon size={14} />
                {label}
                {tab === id && (
                  <motion.div
                    layoutId="contest-tab-indicator"
                    className="absolute bottom-0 inset-x-4 h-0.5 rounded-full bg-[var(--s-primary)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {!user ? (
        <>
          {/* Prize tiers visible even when locked — only when real prize */}
          {contest && contest.prizePool > 0 && <PrizeTierBanner />}
          <LockedContest prizePool={contest?.prizePool} onSignIn={() => setAuthOpen(true)} />
          {/* Still show a peek of the deck blurred */}
          <div className="relative mx-4 mt-4 h-48 rounded-3xl overflow-hidden pointer-events-none select-none">
            <Image
              src={MOCK_PHOTOS[0].imageUrl}
              alt="preview"
              fill
              className="object-cover blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-slate-950/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={28} className="text-white/30" />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Prize tiers — hidden in gallery mode (no real prize pool) */}
          {contest && contest.prizePool > 0 && <PrizeTierBanner />}

          <AnimatePresence mode="wait">
            {tab === "vote" ? (
              <motion.div
                key="vote"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Upload done banner */}
                <AnimatePresence>
                  {uploadDone && (
                    <motion.div
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="mx-4 mt-1 mb-1 flex items-center gap-2 rounded-2xl bg-green-500/12 border border-green-500/20 px-4 py-3"
                    >
                      <CheckCircle2 size={16} className="text-green-400" />
                      <p className="text-sm font-bold text-white">
                        Foto pubblicata! Ora gli altri possono votarla.
                      </p>
                      <button
                        onClick={() => setUploadDone(false)}
                        className="ml-auto text-white/25 text-xs"
                      >
                        ✕
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Total votes earned today */}
                {totalVoted > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mx-4 mt-1 mb-1 flex items-center gap-2 rounded-xl bg-white/4 border border-white/8 px-4 py-2.5"
                  >
                    <TrendingUp size={13} className="text-[var(--s-primary)]" />
                    <p className="text-xs text-white/50">
                      <span className="text-[var(--s-primary)] font-black">{totalVoted}</span> vot{totalVoted === 1 ? "o" : "i"} dati — continua a votare per salire in classifica!
                    </p>
                  </motion.div>
                ) : (
                  <VotingHint />
                )}

                {(contestLoading || contestPhotosLoading) ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-[var(--s-primary)]/50" />
                  </div>
                ) : user && !myPhotosLoading && myPhotos.length === 0 ? (
                  <EmptyState
                    icon={Camera}
                    title="Pubblica prima di votare"
                    subtitle="Carica una foto per sbloccare la classifica voti"
                    cta={{ label: "Carica Foto →", onClick: () => setTab("mine") }}
                    className="mx-4"
                  />
                ) : (
                  <VoteDeck
                    photos={contestPhotos}
                    contestId={contest?.id}
                    onVoteSubmitted={setTotalVoted}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="mine"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="pt-3"
              >
                <MyPhotosTab
                  photos={myPhotos}
                  loading={myPhotosLoading}
                  onUpload={() => setUploadOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Auth modal ──────────────────────────────────────────────────── */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Upload sheet ────────────────────────────────────────────────── */}
      <UploadSheet
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); setUploadError(null); }}
        onSubmit={handleUploadSubmit}
        submitting={submitting}
        uploadError={uploadError}
        hasContest={!!contest && !contestLoading}
      />
    </div>
  );
}
