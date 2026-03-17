"use client";

/**
 * PartnerWidget — Affiliate revenue links for GetYourGuide & Booking.com.
 *
 * Shown only inside the LandmarkSheet bottom-sheet to minimise clutter and
 * maximise conversion: users who opened a landmark detail are already in an
 * "explore" mindset.
 *
 * Replace the `partner_id` / `aid` query-params with your real affiliate IDs
 * before going live.
 */

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface PartnerOffer {
  key: string;
  emoji: string;
  providerLabel: string;
  ctaLabel: string;
  url: string;
  accentClass: string;      // Tailwind text colour
  borderClass: string;      // Tailwind border colour
  bgClass: string;          // Tailwind bg colour
}

function buildOffers(landmarkName: string, city: string): PartnerOffer[] {
  const q    = encodeURIComponent(`${landmarkName} ${city}`);
  const citySlug = city.toLowerCase().replace(/\s+/g, "-");

  return [
    {
      key: "gyg",
      emoji: "🎟️",
      providerLabel: "GetYourGuide",
      ctaLabel: "Tours & Biglietti",
      url: `https://www.getyourguide.com/s?q=${q}&partner_id=WANDERQUEST`,
      accentClass: "text-orange-400",
      borderClass: "border-orange-500/25",
      bgClass: "bg-orange-500/8",
    },
    {
      key: "booking",
      emoji: "🏨",
      providerLabel: "Booking.com",
      ctaLabel: "Attrazioni & Hotel",
      url: `https://www.booking.com/city/es/${citySlug}.html?aid=WANDERQUEST`,
      accentClass: "text-blue-400",
      borderClass: "border-blue-500/25",
      bgClass: "bg-blue-500/8",
    },
  ];
}

export function PartnerWidget({
  landmarkName,
  city,
}: {
  landmarkName: string;
  city: string;
}) {
  const offers = buildOffers(landmarkName, city);

  return (
    <div className="space-y-2">
      {/* Section label */}
      <div className="flex items-center gap-1.5">
        <ExternalLink size={10} className="text-white/25" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
          Esperienze correlate
        </p>
      </div>

      {/* Offer cards */}
      <div className="grid grid-cols-2 gap-2">
        {offers.map((offer, i) => (
          <motion.a
            key={offer.key}
            href={offer.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            whileTap={{ scale: 0.96 }}
            className={[
              "flex flex-col gap-1.5 rounded-2xl border p-3",
              "backdrop-blur-sm transition-colors duration-150",
              "hover:brightness-110 active:brightness-90",
              offer.bgClass,
              offer.borderClass,
            ].join(" ")}
          >
            <span className="text-xl leading-none">{offer.emoji}</span>
            <span className={`text-[11px] font-black leading-tight ${offer.accentClass}`}>
              {offer.ctaLabel}
            </span>
            <span className="text-[10px] text-white/35 leading-tight flex items-center gap-0.5">
              {offer.providerLabel}
              <ExternalLink size={7} className="opacity-60" />
            </span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
