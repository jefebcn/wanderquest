"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** "sm" (default) renders at 9px font · "xs" at 8px · "md" at 11px */
  size?: "xs" | "sm" | "md";
  className?: string;
  animate?: boolean;
}

/**
 * Golden "PRO" badge chip.  Drop into any context next to a user's name,
 * in leaderboard rows, on the bottom nav avatar, etc.
 */
export function ProBadge({ size = "sm", className, animate = true }: Props) {
  const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
    xs: "px-1.5 py-[2px] text-[7px] gap-[2px]",
    sm: "px-2   py-[3px] text-[9px]  gap-[3px]",
    md: "px-2.5 py-1     text-[11px] gap-1",
  };
  const iconSize: Record<NonNullable<Props["size"]>, number> = { xs: 6, sm: 8, md: 10 };

  return (
    <motion.span
      initial={animate ? { scale: 0.7, opacity: 0 } : false}
      animate={animate ? { scale: 1,   opacity: 1 } : false}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn(
        "inline-flex items-center rounded-full font-black tracking-wider leading-none",
        "bg-gradient-to-r from-[#FFD700] to-amber-500 text-slate-900",
        "shadow-[0_0_10px_rgba(255,215,0,0.55),0_0_24px_rgba(255,215,0,0.2)]",
        sizeClasses[size],
        className
      )}
    >
      <Crown size={iconSize[size]} strokeWidth={2.5} />
      PRO
    </motion.span>
  );
}
