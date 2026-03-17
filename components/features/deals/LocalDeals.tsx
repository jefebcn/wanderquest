"use client";

/**
 * LocalDeals — B2B Partner Hub with coupon cards.
 *
 * Free coupons are visible to everyone; Pro-only coupons show a locked
 * glassmorphic overlay for free users.
 *
 * Coupon redemption: copy the alphanumeric code or tap to reveal.
 * Production: replace MOCK_PARTNERS with a Firestore `partners` collection
 * query (or a server action that fetches + caches partner docs).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Copy, Check, Lock, Crown, MapPin, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { cn }              from "@/lib/utils";

// ── Mock data — replace with Firestore fetch in production ────────────────

interface MockCoupon {
  id: string;
  title: string;
  description: string;
  discountText: string;
  code: string;
  isProOnly: boolean;
  expiresAt?: string;
}

interface MockPartner {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  city: string;
  rating: number;
  coupons: MockCoupon[];
}

const MOCK_PARTNERS: MockPartner[] = [
  {
    id: "p1",
    name: "Bar El Xampanyet",
    emoji: "🍺",
    category: "Bar storico",
    description: "Il più autentico bar de El Born dal 1929. Cava artigianale e tapas tradizionali.",
    city: "Barcellona · El Born",
    rating: 4.8,
    coupons: [
      {
        id: "c1",
        title: "1 Tapa gratis",
        description: "Con l'acquisto di qualsiasi bevanda",
        discountText: "GRATIS",
        code: "WANDER-TAPA",
        isProOnly: false,
      },
      {
        id: "c2",
        title: "2×1 Cava artigianale",
        description: "Venerdì e sabato sera — offerta esclusiva Pro",
        discountText: "2×1",
        code: "WANDERPRO-CAVA",
        isProOnly: true,
        expiresAt: "2026-06-30",
      },
    ],
  },
  {
    id: "p2",
    name: "Museu Picasso",
    emoji: "🎨",
    category: "Museo",
    description: "La più vasta collezione di Picasso al mondo. Oltre 4.200 opere nel cuore gotico.",
    city: "Barcellona · Barri Gòtic",
    rating: 4.7,
    coupons: [
      {
        id: "c3",
        title: "10% sconto biglietto",
        description: "Solo acquisto online con codice",
        discountText: "−10%",
        code: "WANDER10",
        isProOnly: false,
      },
      {
        id: "c4",
        title: "Visita guidata inclusa",
        description: "Tour esclusivo di 90 min in italiano (valorizzato €25)",
        discountText: "GRATIS",
        code: "WANDERPRO-PICK",
        isProOnly: true,
        expiresAt: "2026-12-31",
      },
    ],
  },
  {
    id: "p3",
    name: "Cervecería Catalana",
    emoji: "🥘",
    category: "Ristorante",
    description: "Patate brave, croquetes e paella autentica. Prenotazione consigliata.",
    city: "Barcellona · Eixample",
    rating: 4.6,
    coupons: [
      {
        id: "c5",
        title: "Bevanda gratis con menu",
        description: "Un soft drink o birra piccola inclusa",
        discountText: "GRATIS",
        code: "WANDERCCAT",
        isProOnly: false,
      },
      {
        id: "c6",
        title: "Dessert offerto dalla casa",
        description: "Crema catalana o torrija con il tuo pasto",
        discountText: "BONUS",
        code: "WANDERPRO-DOLCE",
        isProOnly: true,
      },
    ],
  },
  {
    id: "p4",
    name: "Sagrada Família Shop",
    emoji: "⛪",
    category: "Souvenir & Arte",
    description: "Il negozio ufficiale della Sagrada Família. Arte, libri e oggetti collezionabili.",
    city: "Barcellona · Eixample",
    rating: 4.5,
    coupons: [
      {
        id: "c7",
        title: "15% su acquisti ≥ €20",
        description: "Sconto esclusivo per esploratori WanderQuest Pro",
        discountText: "−15%",
        code: "WANDERPRO-SHOP",
        isProOnly: true,
      },
    ],
  },
];

// ── Coupon card ───────────────────────────────────────────────────────────

function CouponCard({
  coupon,
  isPro,
}: {
  coupon: MockCoupon;
  isPro: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const locked = coupon.isProOnly && !isPro;

  const handleCopy = () => {
    if (locked) return;
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 30, 50]);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4">
      {/* Pro locked overlay */}
      {locked && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-2xl"
          style={{
            background: "rgba(2,6,23,0.82)",
            backdropFilter: "blur(6px)",
          }}
        >
          <Lock size={14} className="text-[#FFD700]/60" />
          <span className="text-[10px] font-black text-[#FFD700]/70">Solo Pro</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Crown size={9} className="text-[#FFD700]/50" />
            <span className="text-[9px] text-white/30">Upgrade →</span>
          </div>
        </div>
      )}

      <div className={cn("p-3", locked && "blur-[1px]")}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-xs font-black text-white leading-tight">{coupon.title}</p>
          <span
            className={cn(
              "flex-shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-black",
              coupon.isProOnly
                ? "bg-[#FFD700]/15 text-[#FFD700]"
                : "bg-green-500/15 text-green-400"
            )}
          >
            {coupon.discountText}
          </span>
        </div>
        <p className="text-[10px] text-white/40 leading-snug mb-2">{coupon.description}</p>
        {coupon.expiresAt && (
          <p className="text-[9px] text-white/25 mb-2">
            Scade: {new Date(coupon.expiresAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}
        <motion.button
          whileTap={!locked ? { scale: 0.96 } : {}}
          onClick={handleCopy}
          disabled={locked}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-black transition-colors",
            locked
              ? "bg-white/4 text-white/20 cursor-not-allowed"
              : copied
                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                : "bg-white/8 border border-white/10 text-white/60 hover:text-white/90"
          )}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {locked ? "Bloccato" : copied ? "Copiato!" : coupon.code}
        </motion.button>
      </div>
    </div>
  );
}

// ── Partner card ──────────────────────────────────────────────────────────

function PartnerCard({ partner, isPro }: { partner: MockPartner; isPro: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="rounded-2xl border border-white/8 bg-white/[0.035] overflow-hidden"
    >
      {/* Header — tappable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl">{partner.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-black text-white truncate">{partner.name}</p>
            {partner.coupons.some((c) => c.isProOnly) && (
              <Crown size={9} className="text-[#FFD700]/60 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-white/35">{partner.category}</span>
            <span className="text-[9px] text-white/25">·</span>
            <span className="text-[10px] text-white/35 flex items-center gap-0.5">
              <MapPin size={8} />{partner.city}
            </span>
            <span className="text-[9px] text-white/25">·</span>
            <span className="text-[10px] text-[#FFD700]/70 flex items-center gap-0.5 font-bold">
              <Star size={8} fill="currentColor" />{partner.rating}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-white/35">{partner.coupons.length} offert{partner.coupons.length === 1 ? "a" : "e"}</p>
          <p className="text-[10px] text-white/25 mt-0.5">{expanded ? "▲" : "▼"}</p>
        </div>
      </button>

      {/* Coupons */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="coupons"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              <p className="text-[10px] text-white/30 mb-1">{partner.description}</p>
              {partner.coupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} isPro={isPro} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────

export function LocalDeals() {
  const { isPro } = useSubscription();
  const proOnlyCount = MOCK_PARTNERS.flatMap((p) => p.coupons).filter((c) => c.isProOnly).length;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-green-400" />
          <h2 className="text-sm font-black">Local Deals</h2>
        </div>
        {!isPro && (
          <div className="flex items-center gap-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 px-2.5 py-1">
            <Crown size={9} className="text-[#FFD700]" />
            <span className="text-[9px] font-black text-[#FFD700]">{proOnlyCount} offerte Pro</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/30 -mt-1">
        Offerte esclusive dai partner locali di Barcellona. Mostra il codice all&apos;ingresso.
      </p>

      {/* Partner list */}
      {MOCK_PARTNERS.map((partner, i) => (
        <motion.div
          key={partner.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 + i * 0.05 }}
        >
          <PartnerCard partner={partner} isPro={isPro} />
        </motion.div>
      ))}
    </div>
  );
}
