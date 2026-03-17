"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Map, ScanLine, Trophy, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/",            label: "Mappa",       icon: Map      },
  { href: "/scan",        label: "Scansiona",   icon: ScanLine },
  { href: "/leaderboard", label: "Classifica",  icon: Trophy   },
  { href: "/wallet",      label: "Portafoglio", icon: Wallet   },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe border-t border-white/8 bg-slate-950/90 backdrop-blur-xl">
      <div className="flex h-16 items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <motion.button
              key={href}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push(href)}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              {/* Sliding top border indicator */}
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-[#FFD700]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}

              {/* Icon */}
              <motion.div
                animate={active ? { scale: 1.18, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center transition-colors duration-200",
                  active ? "text-[#FFD700]" : "text-white/35"
                )}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 1.7} />
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  "text-[9px] font-bold tracking-wide transition-colors duration-200",
                  active ? "text-[#FFD700]" : "text-white/35"
                )}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
