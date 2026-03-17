"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { X, Mail, Lock, Eye, EyeOff, Chrome, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: Props) {
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth();

  const [tab, setTab]           = useState<Tab>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const reset = () => { setEmail(""); setPassword(""); setError(null); setBusy(false); };

  const handleClose = () => { reset(); onClose(); };

  const handleGoogle = async () => {
    setBusy(true); setError(null);
    try { await signInWithGoogle(); handleClose(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore Google sign-in"); }
    finally { setBusy(false); }
  };

  const handleEmail = async () => {
    if (!email || !password) { setError("Compila tutti i campi."); return; }
    setBusy(true); setError(null);
    try {
      if (tab === "login") await signInWithEmail(email, password);
      else                 await registerWithEmail(email, password);
      handleClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential"))
        setError("Email o password errati.");
      else if (msg.includes("email-already-in-use"))
        setError("Email già registrata. Prova ad accedere.");
      else if (msg.includes("weak-password"))
        setError("Password troppo debole (min. 6 caratteri).");
      else if (msg.includes("user-not-found"))
        setError("Nessun account trovato. Registrati.");
      else
        setError("Errore: " + msg);
    } finally { setBusy(false); }
  };

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
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl bg-slate-900 border-t border-white/10 px-5 pt-5 pb-safe"
          >
            {/* Handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white">Benvenuto su WanderQuest</h2>
                <p className="text-xs text-white/40 mt-0.5">Accedi per esplorare e guadagnare premi reali</p>
              </div>
              <button
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Google CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogle}
              disabled={busy}
              className="relative w-full flex items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-bold text-slate-900 shadow-lg shadow-white/10 mb-4 disabled:opacity-60 min-h-[48px]"
            >
              {busy ? (
                <Loader2 size={18} className="animate-spin text-slate-600" />
              ) : (
                <>
                  {/* Google coloured icon */}
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  Continua con Google
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">oppure</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Tab toggle */}
            <div className="flex rounded-xl bg-white/6 p-1 mb-4 gap-1">
              {(["login", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(null); }}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-xs font-bold transition-all duration-200",
                    tab === t
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-white/45 hover:text-white/70"
                  )}
                >
                  {t === "login" ? "Accedi" : "Registrati"}
                </button>
              ))}
            </div>

            {/* Email input */}
            <div className="relative mb-3">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white/7 border border-white/10 pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
              />
            </div>

            {/* Password input */}
            <div className="relative mb-4">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                type={showPw ? "text" : "password"}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                className="w-full rounded-xl bg-white/7 border border-white/10 pl-10 pr-11 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 mb-4"
              >
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEmail}
              disabled={busy}
              className="w-full rounded-2xl bg-[#FFD700] py-4 text-sm font-black text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.35)] hover:bg-yellow-300 transition-colors disabled:opacity-50 mb-5 min-h-[48px]"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : tab === "login" ? "Accedi" : "Crea account"}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
