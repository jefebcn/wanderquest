"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useContest } from "@/hooks/useContest";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { CurrencyConverter } from "@/components/features/currency/CurrencyConverter";
import { formatCents } from "@/lib/utils";
import {
  Compass,
  ScanLine,
  Trophy,
  Wallet,
  ChevronRight,
  MapPin,
  Sparkles,
  Star,
  Loader2,
  Shield,
  CalendarDays,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Euro,
  Info,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ── Bento step cards config ───────────────────────────────────────────────

const steps = [
  {
    step: "01",
    icon: Compass,
    title: "Esplora",
    desc: "Scopri monumenti storici nei dintorni con la mappa interattiva.",
    gradient: "from-blue-500/20 via-blue-600/8 to-transparent",
    border: "border-blue-500/25",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    glow: "rgba(59,130,246,0.18)",
  },
  {
    step: "02",
    icon: ScanLine,
    title: "Scansiona",
    desc: "Arriva sul posto e scannerizza il monumento per guadagnare punti.",
    gradient: "from-amber-500/20 via-amber-600/8 to-transparent",
    border: "border-amber-500/25",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    glow: "rgba(245,158,11,0.18)",
  },
  {
    step: "03",
    icon: Trophy,
    title: "Scala la classifica",
    desc: "I migliori esploratori si dividono il montepremi in euro.",
    gradient: "from-purple-500/20 via-purple-600/8 to-transparent",
    border: "border-purple-500/25",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
    glow: "rgba(139,92,246,0.18)",
  },
  {
    step: "04",
    icon: Wallet,
    title: "Incassa",
    desc: "Preleva i tuoi premi in euro direttamente sul tuo conto bancario.",
    gradient: "from-green-500/20 via-green-600/8 to-transparent",
    border: "border-green-500/25",
    iconBg: "bg-green-500/15",
    iconColor: "text-green-400",
    glow: "rgba(34,197,94,0.18)",
  },
] as const;

// ── GPS rules config ─────────────────────────────────────────────────────

const GPS_RULES = [
  {
    icon: MapPin,
    color: "text-blue-400",
    bg: "bg-blue-500/12 border-blue-500/20",
    title: "Raggio di verifica: 50 m",
    desc: "Devi trovarti fisicamente entro 50 metri dal monumento per registrare il check-in.",
  },
  {
    icon: CalendarDays,
    color: "text-purple-400",
    bg: "bg-purple-500/12 border-purple-500/20",
    title: "Un check-in al giorno",
    desc: "Puoi guadagnare punti dallo stesso monumento al massimo una volta ogni 24 ore.",
  },
  {
    icon: Smartphone,
    color: "text-amber-400",
    bg: "bg-amber-500/12 border-amber-500/20",
    title: "GPS obbligatorio",
    desc: "L'app richiede l'accesso alla posizione GPS del dispositivo per verificare la tua presenza.",
  },
  {
    icon: Shield,
    color: "text-green-400",
    bg: "bg-green-500/12 border-green-500/20",
    title: "Anti-truffa",
    desc: "Il sistema verifica in tempo reale coordinate, timestamp e IP per garantire la correttezza del gioco.",
  },
];

// ── Payout schedule ──────────────────────────────────────────────────────

const PAYOUT_STEPS = [
  { label: "Fine mese", desc: "Il contest si chiude l'ultimo giorno del mese alle 23:59 (ora locale)." },
  { label: "Calcolo vincitori", desc: "Nei primi 3 giorni del mese vengono calcolate le classifiche finali." },
  { label: "Notifica", desc: "I vincitori ricevono un'email con il riepilogo del premio." },
  { label: "Pagamento", desc: "Il bonifico Stripe/PayPal viene eseguito entro 7 giorni lavorativi." },
];

// ── Floating landmark pill ────────────────────────────────────────────────

function FloatingPill({ name, pts, delay, style }: {
  name: string; pts: number; delay: number; style: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
      transition={{
        opacity: { delay, duration: 0.4 },
        scale:   { delay, duration: 0.4 },
        y:       { delay: delay + 0.5, duration: 3.8, repeat: Infinity, ease: "easeInOut" },
      }}
      className="absolute flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-white/15 px-3 py-1.5 backdrop-blur-md shadow-lg pointer-events-none"
      style={style}
    >
      <MapPin size={10} className="text-[#FFD700]" />
      <span className="text-[11px] font-bold text-white">{name}</span>
      <span className="text-[10px] font-black text-[#FFD700]">+{pts}pt</span>
    </motion.div>
  );
}

// ── Animated prize counter ───────────────────────────────────────────────

function AnimatedPrize({ targetCents }: { targetCents: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1600;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * targetCents));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetCents]);

  const euros = (displayed / 100).toFixed(2);
  return (
    <span className="text-3xl font-black text-[#FFD700] tabular-nums">
      €{euros}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, loading } = useAuth();
  const { contest }       = useContest();
  const [authOpen, setAuthOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <Loader2 size={32} className="animate-spin text-[#FFD700]/50" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden pb-28">

        {/* ── HERO — Barcelona ─────────────────────────────────────── */}
        <section className="relative min-h-[90svh] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0">
            {/* Barcelona skyline — Sagrada Família at dusk */}
            <Image
              src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=85"
              alt="Barcellona — Sagrada Família al tramonto"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Multi-layer gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/70 to-[#020617]/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/60 via-transparent to-transparent" />
            {/* Subtle gold glow at horizon */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FFD700]/6 to-transparent" />
          </div>

          {/* Floating landmark pills */}
          <FloatingPill name="Sagrada Família" pts={750} delay={0.9} style={{ left: "7%",  top: "20%" }} />
          <FloatingPill name="Park Güell"      pts={500} delay={1.3} style={{ left: "50%", top: "14%" }} />
          <FloatingPill name="Casa Batlló"     pts={620} delay={1.7} style={{ left: "14%", top: "40%" }} />

          {/* Copy */}
          <div className="relative z-10 px-5 pb-10">
            {contest && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#FFD700]/12 border border-[#FFD700]/30 px-4 py-1.5 mb-5"
              >
                <Sparkles size={12} className="text-[#FFD700]" />
                <span className="text-xs font-black text-[#FFD700]">
                  {formatCents(contest.prizePool)} in palio — Contest attivo
                </span>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              className="font-serif text-[2.8rem] leading-[1.05] font-black mb-4"
            >
              Unleash Your<br />
              <span style={{
                background: "linear-gradient(135deg,#FFD700 0%,#FFA500 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Inner Explorer
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-base text-white/60 leading-relaxed mb-7 max-w-xs"
            >
              Scansiona monumenti reali, scala la classifica e vinci premi in euro.
              L&apos;avventura è dietro l&apos;angolo.
            </motion.p>

            {user ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
              >
                <Link
                  href="/scan"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-[15px] font-black text-slate-900 shadow-[0_6px_32px_rgba(255,215,0,0.38)] hover:bg-yellow-300 transition-colors min-h-[52px]"
                >
                  <Trophy size={18} />
                  Vai al Contest
                  <ChevronRight size={16} />
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.button
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setAuthOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-[15px] font-black text-slate-900 shadow-[0_6px_32px_rgba(255,215,0,0.38)] hover:bg-yellow-300 transition-colors min-h-[52px]"
                >
                  <Compass size={18} />
                  Inizia l&apos;avventura
                  <ChevronRight size={16} />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setAuthOpen(true)}
                  className="w-full text-center mt-3 text-xs text-white/38 py-2 hover:text-white/60 transition-colors"
                >
                  Hai già un account? <span className="underline underline-offset-2">Accedi</span>
                </motion.button>
              </>
            )}
          </div>
        </section>

        {/* ── ANIMATED PRIZE COUNTER BANNER ──────────────────────── */}
        {contest && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mx-4 mb-8 rounded-2xl border border-[#FFD700]/22 bg-gradient-to-r from-[#FFD700]/12 to-[#FFD700]/4 p-5 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFD700]/15">
              <Star size={22} className="text-[#FFD700]" fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFD700]/60">
                Montepremi attuale — {contest.title}
              </p>
              <AnimatedPrize targetCents={contest.prizePool} />
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-white/35">Contest</p>
              <p className="text-xs font-bold text-white/65">attivo ora</p>
            </div>
          </motion.section>
        )}

        {/* ── HOW IT WORKS — BENTO GRID ─────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Come funziona</p>
            <h2 className="text-2xl font-black">4 passi per vincere</h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {steps.map(({ step, icon: Icon, title, desc, gradient, border, iconBg, iconColor, glow }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.09, type: "spring", stiffness: 280, damping: 24 }}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} ${border} p-4`}
                style={{ boxShadow: `0 8px 32px ${glow}` }}
              >
                <span className="absolute right-3 top-1 text-[3.2rem] font-black leading-none text-white/4 select-none pointer-events-none">
                  {step}
                </span>
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <h3 className="font-black text-[14px] text-white leading-tight mb-1">{title}</h3>
                <p className="text-[11px] text-white/48 leading-snug">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── STATS ROW ──────────────────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="rounded-2xl bg-white/4 border border-white/8 p-5 grid grid-cols-3 divide-x divide-white/8"
          >
            {[
              { value: "500+", label: "Monumenti" },
              { value: "€10k+", label: "Distribuiti" },
              { value: "12+", label: "Città" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center px-2">
                <p className="text-xl font-black text-[#FFD700]">{value}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── GPS VERIFICATION RULES ─────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Regole del gioco</p>
            <h2 className="text-2xl font-black">Come funziona la verifica GPS</h2>
          </motion.div>

          <div className="space-y-3">
            {GPS_RULES.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.07 }}
                className={`flex items-start gap-3 rounded-2xl border p-4 ${bg}`}
              >
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-black/20 ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-snug">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── MONTHLY PAYOUT SCHEDULE ───────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Pagamenti</p>
            <h2 className="text-2xl font-black">Calendario premi mensile</h2>
          </motion.div>

          <div className="relative pl-4">
            {/* Vertical line */}
            <div className="absolute left-[1.35rem] top-2 bottom-2 w-px bg-gradient-to-b from-[#FFD700]/40 via-[#FFD700]/20 to-transparent" />
            <div className="space-y-4">
              {PAYOUT_STEPS.map(({ label, desc }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 z-10">
                    <CheckCircle2 size={13} className="text-[#FFD700]" />
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-black text-white">{label}</p>
                    <p className="text-[11px] text-white/45 leading-snug mt-0.5">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CURRENCY CONVERTER ────────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Strumenti per il viaggiatore</p>
            <h2 className="text-2xl font-black">Convertitore valute live</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <CurrencyConverter />
          </motion.div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────── */}
        <section className="px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15 }}
            className="relative overflow-hidden rounded-3xl border border-[#FFD700]/22 p-6"
            style={{
              background: "linear-gradient(135deg,#1a1200 0%,#0d1a30 100%)",
              boxShadow: "0 12px 48px rgba(255,215,0,0.10)",
            }}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FFD700]/10 blur-3xl" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#FFD700]/50 mb-2">Pronto?</p>
            <h3 className="text-[1.6rem] font-black mb-2 leading-tight">
              La prossima avventura<br />è a un passo.
            </h3>
            <p className="text-sm text-white/48 mb-5 leading-relaxed">
              Registrati gratis in 30 secondi e inizia a guadagnare punti reali esplorando la tua città.
            </p>
            {user ? (
              <Link
                href="/scan"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-sm font-black text-slate-900 shadow-[0_4px_24px_rgba(255,215,0,0.32)] hover:bg-yellow-300 transition-colors min-h-[48px]"
              >
                <Trophy size={16} />
                Vai al Contest
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] py-4 text-sm font-black text-slate-900 shadow-[0_4px_24px_rgba(255,215,0,0.32)] hover:bg-yellow-300 transition-colors min-h-[48px]"
              >
                <Compass size={16} />
                Crea account gratis
              </button>
            )}
          </motion.div>
        </section>

        {/* ── LEGAL FOOTER ───────────────────────────────────────── */}
        <footer className="px-4 pb-4">
          <div className="rounded-2xl bg-white/3 border border-white/6 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Info size={13} className="text-white/30 flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Note legali — Diritto spagnolo
              </p>
            </div>

            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-amber-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Premi e tassazione:</span> In conformità alla normativa
                fiscale spagnola (Ley IRPF), i premi in denaro di importo superiore a <strong className="text-white/55">€300</strong> sono
                soggetti a ritenuta alla fonte del 19% e devono essere dichiarati nella dichiarazione
                dei redditi annuale. WanderQuest emette certificazione fiscale per premi ≥ €300.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Euro size={12} className="text-green-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Prelievo minimo:</span> Il prelievo minimo è di <strong className="text-white/55">€5,00</strong>.
                I pagamenti vengono elaborati tramite Stripe Connect o PayPal entro 7 giorni lavorativi
                dalla richiesta, nei limiti della normativa sui servizi di pagamento (PSD2).
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Shield size={12} className="text-blue-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Concorso a premi:</span> WanderQuest opera ai sensi
                della normativa spagnola sui concorsi a premi (Real Decreto 1463/1997). La
                partecipazione è gratuita. Il montepremi è finanziato dai ricavi della piattaforma,
                non dai partecipanti. Vietata la partecipazione ai minori di 18 anni.
              </p>
            </div>

            <div className="pt-2 border-t border-white/6 flex items-center justify-between">
              <p className="text-[9px] text-white/20">
                © {new Date().getFullYear()} WanderQuest S.L. · Barcelona, España
              </p>
              <p className="text-[9px] text-white/20">v1.0</p>
            </div>
          </div>
        </footer>

      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
