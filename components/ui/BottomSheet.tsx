"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useAnimation, useTransform } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
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
  const controls = useAnimation();
  const y        = useMotionValue(0);

  // Backdrop darkens/lightens with drag distance
  const backdropOpacity = useTransform(y, [0, 300], [1, 0]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Reset y when sheet opens
  useEffect(() => {
    if (open) {
      y.set(0);
      controls.set({ y: 0 });
    }
  }, [open, controls, y]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      const shouldClose = info.offset.y > 100 || info.velocity.y > 600;
      if (shouldClose) {
        controls
          .start({ y: "100%", transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } })
          .then(onClose);
      } else {
        controls.start({ y: 0, transition: { type: "spring", stiffness: 420, damping: 38 } });
      }
    },
    [controls, onClose]
  );

  const maxH =
    snapTo === "full" ? "max-h-[92dvh]" :
    snapTo === "half" ? "max-h-[55dvh]" :
    "max-h-[85dvh]";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — opacity tied to drag position */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-lg"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.25 }}
            style={{ y }}
            animate={controls}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%" }}
            exit={{ y: "110%", transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", stiffness: 390, damping: 38, mass: 0.85 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[70]",
              "flex flex-col",
              "rounded-t-[30px] overflow-hidden",
              // Glassmorphic surface
              "bg-white/10 backdrop-blur-2xl",
              "border-t border-l border-r border-white/15",
              "shadow-[0_-8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.15)]",
              "pb-safe",
              maxH,
              className
            )}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
            >
              <motion.div
                className="h-1 w-10 rounded-full bg-white/30"
                whileTap={{ scaleX: 1.3 }}
              />
            </div>

            {/* Optional header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3">
                <h2 className="text-base font-black text-white">{title}</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white/60 hover:text-white"
                >
                  <X size={16} />
                </motion.button>
              </div>
            )}

            {/* Content — prevent drag propagation inside scrollable area */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
