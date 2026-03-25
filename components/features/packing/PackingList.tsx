"use client";

/**
 * PackingList — Smart Pack Agent UI (2026 Liquid Glass style).
 */

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Luggage,
  Search,
  Loader2,
  ShieldAlert,
  ShieldX,
  ShieldCheck,
  ExternalLink,
  Share2,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Sparkles,
  ShoppingCart,
  MapPin,
  X,
} from "lucide-react";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { generatePackingList } from "@/actions/packing";
import { searchDestinations, type Destination } from "@/lib/destinations";
import { cn } from "@/lib/utils";
import type {
  PackingCategory,
  PackingItem,
  PackingListData,
  GeneratePackingListResult,
  SafetyLevel,
} from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const AMAZON_AFFILIATE_TAG = "wanderquest-21";
const AMAZON_BASE = "https://www.amazon.it/s";

const CATEGORY_META: Record<
  PackingCategory,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  Clothes: {
    label: "Abbigliamento",
    emoji: "👕",
    color: "text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
  },
  Electronics: {
    label: "Elettronica",
    emoji: "🔌",
    color: "text-purple-400",
    bg: "bg-purple-500/8",
    border: "border-purple-500/20",
  },
  Documents: {
    label: "Documenti",
    emoji: "📄",
    color: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
  },
  Toiletries: {
    label: "Cosmetici & Igiene",
    emoji: "🧴",
    color: "text-teal-400",
    bg: "bg-teal-500/8",
    border: "border-teal-500/20",
  },
};

const SAFETY_META: Record<
  SafetyLevel,
  {
    icon: typeof ShieldCheck;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  STABLE: {
    icon: ShieldCheck,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/25",
    label: "Sicuro",
  },
  WARNING: {
    icon: ShieldAlert,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    label: "Attenzione",
  },
  CRITICAL: {
    icon: ShieldX,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "Critico",
  },
};

const CATEGORIES: PackingCategory[] = [
  "Clothes",
  "Electronics",
  "Documents",
  "Toiletries",
];

// ── Affiliate link helper ─────────────────────────────────────────────────────

function buildAffiliateUrl(query: string): string {
  const params = new URLSearchParams({
    k: query,
    tag: AMAZON_AFFILIATE_TAG,
    ref: "nb_sb_noss",
  });
  return `${AMAZON_BASE}?${params.toString()}`;
}

// ── Autocomplete dropdown ─────────────────────────────────────────────────────

function DestinationAutocomplete({
  value,
  onChange,
  onSelect,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (dest: Destination) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update suggestions on value change
  useEffect(() => {
    if (value.length >= 1) {
      const results = searchDestinations(value, 8);
      setSuggestions(results);
      setOpen(results.length > 0 && focused);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [value, focused]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (dest: Destination) => {
    onChange(dest.city);
    setOpen(false);
    onSelect(dest);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <MapPin
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setOpen(false);
            onSubmit();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        onFocus={() => {
          setFocused(true);
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          // Delay so click on suggestion fires first
          setTimeout(() => setFocused(false), 150);
        }}
        placeholder="Destinazione (es. Malaga, Tokyo, Dubai…)"
        autoComplete="off"
        className={cn(
          "w-full rounded-xl bg-white/6 border border-white/10 pl-8 pr-3 py-2.5",
          "text-[13px] text-white placeholder:text-white/25",
          "focus:outline-none focus:border-[var(--s-accent)]/50 focus:bg-white/8 transition-all"
        )}
      />

      {/* Dropdown */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl overflow-hidden"
            style={{
              background: "rgba(10, 18, 32, 0.95)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {/* Group by continent */}
            {Array.from(
              new Set(suggestions.map((d) => d.continent))
            ).map((continent) => (
              <div key={continent}>
                <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-widest text-white/25">
                  {continent}
                </p>
                {suggestions
                  .filter((d) => d.continent === continent)
                  .map((dest) => (
                    <button
                      key={`${dest.city}-${dest.country}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(dest);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/6 transition-colors text-left group"
                    >
                      <span className="text-base flex-shrink-0 leading-none">
                        {dest.flag}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white truncate leading-none mb-0.5">
                          {dest.city}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          {dest.country}
                        </p>
                      </div>
                      <MapPin
                        size={10}
                        className="text-[var(--s-accent)]/0 group-hover:text-[var(--s-accent)]/60 transition-colors flex-shrink-0"
                      />
                    </button>
                  ))}
              </div>
            ))}

            {/* Free-type hint */}
            <div className="px-3 py-2 border-t border-white/6">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  onSubmit();
                }}
                className="w-full flex items-center gap-2 text-[11px] text-white/35 hover:text-white/60 transition-colors"
              >
                <Search size={10} />
                Cerca &quot;{value}&quot; — qualsiasi destinazione nel mondo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Liquid Glass Checkbox ─────────────────────────────────────────────────────

function GlassCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      aria-checked={checked}
      role="checkbox"
      className={cn(
        "flex-shrink-0 size-5 rounded-md border transition-all duration-200",
        "flex items-center justify-center",
        checked
          ? "bg-[var(--s-accent)] border-[var(--s-accent)] shadow-[0_0_8px_rgba(45,212,191,0.4)]"
          : "bg-white/5 border-white/20 hover:border-white/40"
      )}
    >
      {checked && (
        <motion.svg
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
        >
          <path
            d="M2 5L4 7L8 3"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      )}
    </button>
  );
}

// ── PackingItem Row ───────────────────────────────────────────────────────────

function PackingItemRow({
  item,
  onToggle,
}: {
  item: PackingItem;
  onToggle: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2.5 py-2 group"
    >
      <GlassCheckbox
        checked={item.checked}
        onChange={() => onToggle(item.id)}
      />

      <span className="text-base flex-shrink-0 leading-none">{item.emoji}</span>

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-[13px] font-medium transition-all duration-200",
            item.checked
              ? "line-through text-white/30"
              : item.essential
              ? "text-white font-bold"
              : "text-white/75"
          )}
        >
          {item.name}
          {item.essential && !item.checked && (
            <span className="ml-1.5 text-[9px] font-black text-[var(--s-primary)] bg-[var(--s-primary)]/15 rounded-full px-1.5 py-0.5 align-middle">
              ESSENZIALE
            </span>
          )}
        </span>
      </div>

      {/* Amazon affiliate button */}
      <a
        href={buildAffiliateUrl(item.affiliateQuery)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Compra ${item.name} su Amazon`}
        className={cn(
          "flex-shrink-0 flex items-center gap-1 rounded-full px-2 py-1",
          "text-[9px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/20",
          "hover:bg-amber-500/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100",
          "focus:outline-none focus:ring-1 focus:ring-amber-400/50"
        )}
      >
        <ShoppingCart size={8} strokeWidth={2} />
        Buy
      </a>
    </motion.div>
  );
}

// ── Category Section ──────────────────────────────────────────────────────────

function CategorySection({
  category,
  items,
  onToggle,
}: {
  category: PackingCategory;
  items: PackingItem[];
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = CATEGORY_META[category];
  const checkedCount = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  return (
    <div className={cn("rounded-2xl border overflow-hidden", meta.bg, meta.border)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 p-3.5 text-left"
      >
        <span className="text-xl leading-none">{meta.emoji}</span>
        <span className={cn("text-sm font-black flex-1", meta.color)}>
          {meta.label}
        </span>
        <span className="text-[11px] text-white/40 font-mono mr-1.5">
          {checkedCount}/{total}
        </span>
        {expanded ? (
          <ChevronUp size={14} className="text-white/30 flex-shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-white/30 flex-shrink-0" />
        )}
      </button>

      <div className="px-3.5 pb-1">
        <div className="h-0.5 rounded-full bg-white/6 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              meta.color.replace("text-", "bg-")
            )}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-3.5 pb-3 divide-y divide-white/5"
          >
            {items.map((item) => (
              <PackingItemRow key={item.id} item={item} onToggle={onToggle} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Safety Advisory Card ──────────────────────────────────────────────────────

function TravelAdvisoryCard({
  level,
  advisory,
}: {
  level: SafetyLevel;
  advisory: string;
}) {
  if (level === "STABLE") return null;
  const meta = SAFETY_META[level];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-4 flex items-start gap-3",
        meta.bg,
        meta.border
      )}
    >
      <Icon
        size={18}
        className={cn("flex-shrink-0 mt-0.5", meta.color)}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-black mb-1 uppercase tracking-wide",
            meta.color
          )}
        >
          Avviso di Viaggio · {meta.label}
        </p>
        <p className="text-[12px] text-white/65 leading-relaxed">{advisory}</p>
      </div>
    </motion.div>
  );
}

// ── Currency Banner ───────────────────────────────────────────────────────────

function CurrencyBanner({
  currencyCode,
  currencyNote,
}: {
  currencyCode: string;
  currencyNote: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--s-primary)]/25 bg-[var(--s-primary)]/8 p-3.5 flex items-center gap-3"
    >
      <ArrowRightLeft
        size={16}
        className="text-[var(--s-primary)] flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-[var(--s-primary)] uppercase tracking-wide mb-0.5">
          Valuta Auto-Pin · {currencyCode}
        </p>
        <p className="text-[12px] text-white/60 leading-snug">{currencyNote}</p>
      </div>
    </motion.div>
  );
}

// ── Post Gear Button ──────────────────────────────────────────────────────────

function PostGearButton({
  destination,
  items,
  userId,
  displayName,
  onPosted,
}: {
  destination: string;
  items: PackingItem[];
  userId: string;
  displayName: string;
  onPosted: () => void;
}) {
  const [posting, setPosting] = useState(false);
  const [done, setDone] = useState(false);

  const handlePost = async () => {
    if (posting || done) return;
    setPosting(true);
    try {
      const { db } = getFirebaseClient();
      const checkedItems = items
        .filter((i) => i.checked)
        .map((i) => `${i.emoji} ${i.name}`)
        .slice(0, 12);
      const caption = `🎒 Il mio gear per ${destination}: ${checkedItems.join(", ")}. Generato con Smart Pack Agent su WanderQuest!`;

      await addDoc(collection(db, "gear_posts"), {
        userId,
        displayName,
        destination,
        caption,
        items: items.filter((i) => i.checked).map((i) => ({
          name: i.name,
          emoji: i.emoji,
          category: i.category,
        })),
        likes: 0,
        uploadedAt: new Date().toISOString(),
        type: "gear_post",
      });

      setDone(true);
      onPosted();
    } catch {
      /* non-fatal */
    } finally {
      setPosting(false);
    }
  };

  return (
    <button
      onClick={handlePost}
      disabled={posting || done}
      className={cn(
        "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition-all",
        done
          ? "bg-teal-500/15 border border-teal-500/25 text-teal-400"
          : "bg-white/[0.07] border border-white/12 text-white/70 hover:bg-white/10 active:scale-95"
      )}
    >
      {posting ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Share2 size={14} />
      )}
      {done ? "Pubblicato! 🎉" : "Posta il mio Gear"}
    </button>
  );
}

// ── Main PackingList Component ────────────────────────────────────────────────

interface PackingListProps {
  onCurrencyDetected?: (code: string) => void;
  onSafetyDetected?: (level: SafetyLevel, advisory: string) => void;
}

export function PackingList({
  onCurrencyDetected,
  onSafetyDetected,
}: PackingListProps) {
  const { user } = useAuth();
  const [destination, setDestination] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratePackingListResult | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [gearPosted, setGearPosted] = useState(false);

  // ── Load saved list from Firestore ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { db } = getFirebaseClient();
        const snap = await getDoc(doc(db, "packing_lists", user.uid));
        if (snap.exists()) {
          const data = snap.data() as PackingListData;
          setResult({
            destination: data.destination,
            country: data.country,
            countryCode: data.countryCode,
            weatherSummary: data.weatherSummary,
            month: data.month,
            items: data.items.map(({ checked: _c, ...rest }) => rest),
            safetyLevel: data.safetyLevel,
            safetyAdvisory: data.safetyAdvisory,
            currencyCode: data.currencyCode,
            currencyNote: data.currencyNote,
          });
          setItems(data.items);
          setDestination(data.destination);
        }
      } catch {
        /* non-fatal */
      }
    })();
  }, [user]);

  // ── Persist checked state to Firestore ─────────────────────────────────────
  const persistItems = useCallback(
    async (updatedItems: PackingItem[], r: GeneratePackingListResult) => {
      if (!user) return;
      try {
        const { db } = getFirebaseClient();
        const listData: PackingListData = {
          id: user.uid,
          userId: user.uid,
          destination: r.destination,
          country: r.country,
          countryCode: r.countryCode,
          weatherSummary: r.weatherSummary,
          month: r.month,
          items: updatedItems,
          safetyLevel: r.safetyLevel,
          safetyAdvisory: r.safetyAdvisory,
          currencyCode: r.currencyCode,
          currencyNote: r.currencyNote,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "packing_lists", user.uid), listData, {
          merge: true,
        });
      } catch {
        /* non-fatal */
      }
    },
    [user]
  );

  // ── Toggle item ─────────────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (id: string) => {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        );
        if (result) persistItems(updated, result);
        return updated;
      });
    },
    [result, persistItems]
  );

  // ── Generate list ───────────────────────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    const city = destination.trim();
    if (!city) return;
    setError(null);
    setGearPosted(false);

    startTransition(async () => {
      const response = await generatePackingList(city);

      if (!response.ok) {
        setError(response.error);
        return;
      }

      const data = response.data;
      const withChecked: PackingItem[] = data.items.map((item) => ({
        ...item,
        checked: false,
      }));

      setResult(data);
      setItems(withChecked);

      if (data.currencyCode) onCurrencyDetected?.(data.currencyCode);
      if (
        data.safetyLevel &&
        data.safetyLevel !== "STABLE" &&
        data.safetyAdvisory
      ) {
        onSafetyDetected?.(data.safetyLevel, data.safetyAdvisory);
      }

      if (user) persistItems(withChecked, data);
    });
  }, [
    destination,
    user,
    persistItems,
    onCurrencyDetected,
    onSafetyDetected,
  ]);

  // ── Grouped items ───────────────────────────────────────────────────────────
  const grouped = CATEGORIES.reduce<Record<PackingCategory, PackingItem[]>>(
    (acc, cat) => {
      acc[cat] = items.filter((i) => i.category === cat);
      return acc;
    },
    { Clothes: [], Electronics: [], Documents: [], Toiletries: [] }
  );

  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.checked).length;
  const overallPct =
    totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <section
      className="px-4 mb-8"
      style={{
        paddingBottom:
          "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
      }}
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-primary)] mb-0.5">
          Smart Pack Agent · AI
        </p>
        <h2 className="font-display text-title-lg font-black flex items-center gap-2">
          <Luggage size={20} className="text-[var(--s-accent)]" />
          Prepara il Bagaglio
        </h2>
      </motion.div>

      {/* Search card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, type: "spring", stiffness: 280, damping: 26 }}
        className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 mb-4"
        style={{
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        }}
      >
        <div className="flex gap-2">
          <DestinationAutocomplete
            value={destination}
            onChange={setDestination}
            onSelect={() => {
              /* city already set via onChange */
            }}
            onSubmit={handleGenerate}
            loading={isPending}
          />

          <button
            onClick={handleGenerate}
            disabled={isPending || !destination.trim()}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-black transition-all",
              "bg-[var(--s-accent)] text-slate-900 active:scale-95",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            {isPending ? "..." : "Genera"}
          </button>
        </div>

        {/* Loading indicator */}
        <AnimatePresence>
          {isPending && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-2"
            >
              <Sparkles
                size={12}
                className="text-[var(--s-accent)] animate-pulse"
              />
              <p className="text-[11px] text-white/50">
                Haiku analizza meteo e destinazione…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && !isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-start gap-1.5"
          >
            <X size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-400 leading-snug">{error}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && items.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="flex flex-col gap-3"
          >
            {/* Trip header */}
            <div
              className="rounded-2xl border border-white/8 p-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(255,215,0,0.05) 100%)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--s-accent)] mb-0.5">
                    Prossimo Viaggio
                  </p>
                  <h3 className="font-display text-lg font-black text-white leading-tight">
                    {result.destination}
                  </h3>
                  <p className="text-[11px] text-white/45 mt-0.5">
                    {result.weatherSummary}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[22px] font-black text-[var(--s-accent)] font-mono leading-none">
                    {overallPct}%
                  </span>
                  <span className="text-[10px] text-white/35">preparato</span>
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--s-accent)] to-[var(--s-primary)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-white/30 mt-1.5">
                {checkedItems} di {totalItems} articoli preparati
              </p>
            </div>

            {/* Travel Advisory */}
            {result.safetyLevel &&
              result.safetyLevel !== "STABLE" &&
              result.safetyAdvisory && (
                <TravelAdvisoryCard
                  level={result.safetyLevel}
                  advisory={result.safetyAdvisory}
                />
              )}

            {/* Currency Banner */}
            {result.currencyCode && result.currencyNote && (
              <CurrencyBanner
                currencyCode={result.currencyCode}
                currencyNote={result.currencyNote}
              />
            )}

            {/* Category checklists */}
            {CATEGORIES.map((cat) =>
              grouped[cat].length > 0 ? (
                <CategorySection
                  key={cat}
                  category={cat}
                  items={grouped[cat]}
                  onToggle={handleToggle}
                />
              ) : null
            )}

            {/* Social footer */}
            {user && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-white/30">
                  {user.displayName
                    ? `Lista di ${user.displayName}`
                    : "La tua lista personale"}
                </p>
                <PostGearButton
                  destination={result.destination}
                  items={items}
                  userId={user.uid}
                  displayName={user.displayName ?? "Esploratore"}
                  onPosted={() => setGearPosted(true)}
                />
              </div>
            )}

            {gearPosted && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[11px] text-teal-400"
              >
                🎉 Il tuo gear è stato pubblicato nel Social Feed!
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-3 py-10 text-center"
        >
          <div className="size-16 rounded-2xl bg-[var(--s-accent)]/10 border border-[var(--s-accent)]/20 flex items-center justify-center">
            <Luggage size={28} className="text-[var(--s-accent)]/70" />
          </div>
          <div>
            <p className="text-sm font-bold text-white/60 mb-1">Dove vai?</p>
            <p className="text-[12px] text-white/35 max-w-[240px] leading-relaxed">
              Inserisci la tua destinazione e Haiku genererà una lista
              intelligente basata su meteo e contesto locale.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/20">
            <ExternalLink size={9} />
            <span>
              400+ destinazioni · Link Amazon · Salvataggio offline
            </span>
          </div>
        </motion.div>
      )}
    </section>
  );
}
