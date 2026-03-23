/**
 * Shared Framer Motion presets — use these instead of ad-hoc spring configs
 * to ensure consistent animation feel across the app.
 */

export const spring = {
  /** Fast, responsive — for interactive feedback (taps, toggles) */
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  /** Smooth, natural — for content entry/exit */
  gentle: { type: "spring" as const, stiffness: 260, damping: 26 },
  /** Playful bounce — for badges, achievements */
  bouncy: { type: "spring" as const, stiffness: 500, damping: 25, mass: 0.8 },
} as const;

export const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
} as const;

export const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const, delay },
});

/**
 * Stagger delay for list items. Capped at 0.4s so long lists don't feel slow.
 * @param index  0-based item index
 * @param base   delay per item in seconds (default 0.04)
 */
export const stagger = (index: number, base = 0.04) => ({
  delay: Math.min(index * base, 0.4),
});
