"use client";

/**
 * TravelConcierge — AI chat assistant powered by GPT-4o (Pro feature).
 *
 * Free users see a locked overlay prompting upgrade.
 * Pro users get a floating chat panel with streaming responses and
 * GPS + weather context injected automatically.
 */

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Sparkles, Loader2, Crown, Lock,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { useSubscription }   from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface ChatContext {
  lat?: number;
  lng?: number;
  weather?: { description: string; temp: number; condition: string };
}

// ── Locked overlay for free users ─────────────────────────────────────────

function LockedOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4 py-10 text-center px-6"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20">
        <Lock size={24} className="text-[#FFD700]" />
      </div>
      <div>
        <p className="font-black text-base text-white mb-1">Concierge AI — Pro</p>
        <p className="text-xs text-white/40 max-w-[220px] leading-relaxed">
          Passa a WanderQuest Pro per sbloccare il tuo assistente di viaggio AI personale.
        </p>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 px-3 py-1.5">
        <Crown size={11} className="text-[#FFD700]" />
        <span className="text-[11px] font-black text-[#FFD700]">WanderQuest Pro — €4,99/mese</span>
      </div>
    </motion.div>
  );
}

// ── Main concierge component ──────────────────────────────────────────────

export function TravelConcierge({ ctx }: { ctx?: ChatContext }) {
  const { isPro }               = useSubscription();
  const [open, setOpen]         = useState(false);
  const [token, setToken]       = useState<string | null>(null);
  const bottomRef               = useRef<HTMLDivElement>(null);

  // Get auth token for the Authorization header
  useEffect(() => {
    if (!open || !isPro) return;
    getFirebaseClient()
      .auth.currentUser?.getIdToken()
      .then(setToken)
      .catch(() => setToken(null));
  }, [open, isPro]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: "/api/chat",
    body: { context: ctx ?? {} },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    initialMessages: [
      {
        id:      "welcome",
        role:    "assistant",
        content: "Ciao! Sono il tuo concierge WanderQuest 🗺️. Dove vuoi andare adesso? Dimmi la tua situazione e ti suggerisco il landmark perfetto.",
      },
    ],
  });

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full",
          "shadow-[0_6px_28px_rgba(0,0,0,0.5)]",
          "transition-colors duration-200",
          isPro
            ? "bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
            : "bg-slate-800 border border-white/10"
        )}
        style={isPro ? { boxShadow: "0 6px 28px rgba(139,92,246,0.4)" } : {}}
        title="AI Concierge"
      >
        {isPro
          ? <Sparkles size={20} className="text-white" />
          : <MessageSquare size={20} className="text-white/30" />
        }
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed inset-x-0 bottom-16 z-50 flex flex-col"
            style={{ top: "15vh" }}
          >
            <div
              className="flex flex-1 flex-col overflow-hidden rounded-t-3xl border-t border-x border-white/12"
              style={{
                background: "rgba(2,6,23,0.97)",
                backdropFilter: "blur(40px)",
                boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-500/25">
                  <Sparkles size={15} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-black">AI Concierge</p>
                  <p className="text-[10px] text-white/35">
                    {ctx?.lat ? "Posizione attiva" : "Suggerimenti personalizzati"}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="ml-auto">
                  <X size={18} className="text-white/30 hover:text-white/60 transition-colors" />
                </button>
              </div>

              {/* Messages or locked overlay */}
              {!isPro ? (
                <LockedOverlay />
              ) : (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-purple-600/25 border border-purple-500/30 text-white"
                            : "bg-white/6 border border-white/8 text-white/85"
                        )}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-white/6 border border-white/8 px-3.5 py-2.5">
                        <Loader2 size={13} className="animate-spin text-purple-400" />
                        <span className="text-xs text-white/40">Il concierge sta pensando…</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}

              {/* Input (Pro only) */}
              {isPro && (
                <div className="px-4 py-3 border-t border-white/8">
                  <form
                    onSubmit={isLoading ? (e) => { e.preventDefault(); stop(); } : handleSubmit}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Chiedimi dove andare…"
                      className="flex-1 rounded-2xl bg-white/6 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/40"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="submit"
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                        isLoading
                          ? "bg-red-500/20 border border-red-500/30"
                          : "bg-purple-600 hover:bg-purple-500"
                      )}
                    >
                      {isLoading
                        ? <X size={14} className="text-red-400" />
                        : <Send size={14} className="text-white" />
                      }
                    </motion.button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
