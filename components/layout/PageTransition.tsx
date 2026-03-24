"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Wraps page content with a slide-in transition keyed by pathname.
 * Gives the app a native tab-switch feel with minimal flicker.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
        style={{ minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
