"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ScanLine, Trophy, Wallet } from "lucide-react";
import { useAuth }         from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { cn }              from "@/lib/utils";
import { spring }          from "@/lib/motion";
import Image               from "next/image";

const tabs = [
  { href: "/",            label: "Home",       icon: Home     },
  { href: "/scan",        label: "Contest",    icon: ScanLine },
  { href: "/leaderboard", label: "Classifica", icon: Trophy   },
  { href: "/profile",     label: "Profilo",    icon: Wallet   },
] as const;

export function BottomNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user }  = useAuth();
  const { isPro } = useSubscription();

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe border-t border-[var(--c-nav-border)] bg-[var(--c-nav-bg)] backdrop-blur-2xl"
      style={{ boxShadow: "0 -1px 0 rgba(255,255,255,0.06), 0 -12px 40px rgba(2,6,23,0.7)" }}
    >
      <div className="flex h-16 items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active   = pathname === href || (href !== "/" && pathname.startsWith(href));
          const isWallet = href === "/profile";

          return (
            <motion.button
              key={href}
              whileTap={{ scale: 0.92 }}
              onClick={() => router.push(href)}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              style={{ touchAction: "manipulation" }}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px]"
            >
              {/* Active top indicator */}
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-4 top-0 h-[3px] rounded-full bg-[var(--c-nav-active)]"
                  transition={spring.snappy}
                />
              )}

              {/* Icon / avatar */}
              <motion.div
                animate={active ? { scale: 1.18, y: -1 } : { scale: 1, y: 0 }}
                transition={spring.snappy}
                className={cn(
                  "flex h-8 w-8 items-center justify-center transition-colors duration-200",
                  active ? "text-[var(--c-nav-active)]" : "text-[var(--c-nav-inactive)]"
                )}
              >
                {isWallet && user?.photoURL ? (
                  <div className="relative">
                    <div
                      className={cn(
                        "relative h-7 w-7 overflow-hidden rounded-full",
                        active ? "ring-2 ring-[var(--c-nav-active)]" : "ring-1 ring-white/20"
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
                    {isPro && (
                      <span
                        className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-[var(--p-gold-300)] to-amber-500"
                        style={{ boxShadow: "0 0 6px rgba(255,215,0,0.7)" }}
                      >
                        <span className="text-[5px] font-black text-slate-900">P</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <Icon size={21} strokeWidth={active ? 2.4 : 1.7} />
                )}
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-bold tracking-wide transition-colors duration-200",
                  active ? "text-[var(--c-nav-active)]" : "text-[var(--c-nav-inactive)]"
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
