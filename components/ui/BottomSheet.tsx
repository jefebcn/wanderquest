"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** How much of the sheet snaps to — default "auto" (content height) */
  snapTo?: "half" | "full" | "auto";
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  snapTo = "auto",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const maxH =
    snapTo === "full" ? "max-h-[92dvh]" :
    snapTo === "half" ? "max-h-[55dvh]"  :
    "max-h-[85dvh]";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38, mass: 0.9 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[70]",
              "rounded-t-[28px] overflow-hidden",
              "border-t border-white/10",
              "bg-slate-900/95 backdrop-blur-xl",
              "pb-safe",
              maxH,
              className
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3">
                <h2 className="text-base font-black text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/50 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
