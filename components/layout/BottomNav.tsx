"use client";

import { usePathname, useRouter } from "next/navigation";
import { Map, ScanLine, Trophy, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/",           label: "Mappa",      icon: Map      },
  { href: "/scan",       label: "Scansiona",  icon: ScanLine },
  { href: "/leaderboard",label: "Classifica", icon: Trophy   },
  { href: "/wallet",     label: "Portafoglio",icon: Wallet   },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#080C1A]/95 backdrop-blur-md pb-safe">
      <div className="flex h-16 items-end pb-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-1 flex-col items-center gap-1 py-1 transition-colors"
              aria-current={active ? "page" : undefined}
            >
              <div
                className={cn(
                  "rounded-2xl p-2 transition-all duration-200",
                  active
                    ? "bg-amber-400/20 text-amber-400"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold tracking-wide transition-colors",
                  active ? "text-amber-400" : "text-white/40"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
