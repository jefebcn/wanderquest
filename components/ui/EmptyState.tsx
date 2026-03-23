"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  cta?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Reusable empty state component following WanderQuest's visual language.
 * Use in place of ad-hoc empty state blocks across the app.
 */
export function EmptyState({ icon: Icon, title, subtitle, cta, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/8 mb-4">
        <Icon size={28} className="text-white/30" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-bold text-white/70 mb-1">{title}</p>
      {subtitle && (
        <p className="text-xs text-white/35 leading-relaxed max-w-[220px]">{subtitle}</p>
      )}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-4 rounded-xl bg-[var(--s-primary)] px-4 py-2 text-xs font-black text-slate-900 min-h-[36px]"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
