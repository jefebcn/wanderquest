"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ScanLine, Trophy, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Image from "next/image";

const tabs = [
  { href: "/",            label: "Home",       icon: Home     },
  { href: "/scan",        label: "Scansiona",  icon: ScanLine },
  { href: "/leaderboard", label: "Classifica", icon: Trophy   },
  { href: "/profile",     label: "Profilo",    icon: Wallet   },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe border-t border-white/8 bg-slate-950/92 backdrop-blur-xl">
      <div className="flex h-16 items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          const isWallet = href === "/profile";

          return (
            <motion.button
              key={href}
              whileTap={{ scale: 0.88 }}
              onClick={() => router.push(href)}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px]"
            >
              {/* Active top indicator */}
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-[#FFD700]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}

              {/* Icon / avatar */}
              <motion.div
                animate={active ? { scale: 1.18, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center transition-colors duration-200",
                  active ? "text-[#FFD700]" : "text-white/35"
                )}
              >
                {isWallet && user?.photoURL ? (
                  /* Show user photo on the wallet/profile tab */
                  <div
                    className={cn(
                      "relative h-7 w-7 overflow-hidden rounded-full",
                      active ? "ring-2 ring-[#FFD700]" : "ring-1 ring-white/20"
                    )}
                  >
                    <Image
                      src={user.photoURL}
                      alt={user.displayName ?? "Avatar"}
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <Icon size={21} strokeWidth={active ? 2.4 : 1.7} />
                )}
              </motion.div>

              {/* Label — first name when wallet + logged in */}
              <span
                className={cn(
                  "text-[9px] font-bold tracking-wide transition-colors duration-200",
                  active ? "text-[#FFD700]" : "text-white/35"
                )}
              >
                {isWallet && user?.displayName
                  ? user.displayName.split(" ")[0].slice(0, 9)
                  : label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
