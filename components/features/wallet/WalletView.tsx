"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getFirebaseClient } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContest } from "@/hooks/useContest";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { getWallet, requestWithdrawal, initiateStripeOnboarding } from "@/actions/wallet";
import { WalletSkeleton }   from "@/components/ui/Skeleton";
import { formatCents }      from "@/lib/utils";
import { GoPro }            from "@/components/features/subscription/GoPro";
import { LocalDeals }       from "@/components/features/deals/LocalDeals";
import { useSubscription }  from "@/hooks/useSubscription";
import type { UserWallet }  from "@/types";
import {
  Wallet,
  ArrowDownToLine,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  Star,
  Tag,
  CreditCard,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock transaction history (replace with Firestore fetch when live) ──────
// Each transaction would come from wallets/{uid}/transactions sub-collection
interface Transaction {
  id: string;
  type: "earn" | "withdraw";
  amountCents: number;
  label: string;
  timestamp: string; // ISO string
  status: "completed" | "pending";
}

function useMockTransactions(wallet: UserWallet | null): Transaction[] {
  if (!wallet) return [];
  return [
    { id: "1", type: "earn",     amountCents: 250,  label: "Colosseo — Check-in",        timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),  status: "completed" },
    { id: "2", type: "earn",     amountCents: 500,  label: "Pantheon — Check-in",         timestamp: new Date(Date.now() - 1000 * 3600 * 26).toISOString(), status: "completed" },
    { id: "3", type: "earn",     amountCents: 750,  label: "Trevi Fountain — Check-in",   timestamp: new Date(Date.now() - 1000 * 3600 * 50).toISOString(), status: "completed" },
    { id: "4", type: "withdraw", amountCents: 1000, label: "Prelievo Stripe",             timestamp: new Date(Date.now() - 1000 * 3600 * 72).toISOString(), status: "pending"   },
    { id: "5", type: "earn",     amountCents: 300,  label: "Foro Romano — Check-in",      timestamp: new Date(Date.now() - 1000 * 3600 * 100).toISOString(),status: "completed" },
  ];
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Prize Card ────────────────────────────────────────────────────────────

function PrizeCard({ wallet }: { wallet: UserWallet }) {
  const progressPct = Math.min(100, (wallet.balanceCents / 500) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      // Neumorphic-gradient hybrid: deep directional gradient + raised shadow + inner highlight
      style={{
        background: "linear-gradient(140deg, #1b2d4f 0%, #111827 45%, #1a1200 100%)",
        boxShadow:
          "8px 8px 24px rgba(0,0,0,0.6), " +
          "-4px -4px 14px rgba(255,255,255,0.04), " +
          "inset 0 1px 0 rgba(255,255,255,0.12), " +
          "inset 0 -1px 0 rgba(0,0,0,0.3)",
      }}
      className={cn(
        "relative overflow-hidden rounded-3xl p-6",
        "border border-white/10"
      )}
    >
      {/* Glowing orbs */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-[var(--s-primary)]/12 blur-3xl animate-breathe" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-600/18 blur-2xl" />

      {/* Card header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Saldo Disponibile</p>
          <p className="text-4xl font-black text-white mt-0.5 tabular-nums">
            {formatCents(wallet.balanceCents)}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <Wallet size={18} className="text-[var(--s-primary)]" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl bg-white/8 border border-white/8 p-3">
          <p className="text-xs text-white/45 flex items-center gap-1">
            <TrendingUp size={10} /> Totale guadagnato
          </p>
          <p className="text-sm font-black mt-0.5">{formatCents(wallet.totalEarnedCents)}</p>
        </div>
        <div className="rounded-2xl bg-white/8 border border-white/8 p-3">
          <p className="text-xs text-white/45 flex items-center gap-1">
            <Clock size={10} /> In elaborazione
          </p>
          <p className="text-sm font-black mt-0.5">
            {wallet.pendingCents > 0 ? formatCents(wallet.pendingCents) : "—"}
          </p>
        </div>
      </div>

      {/* Progress toward minimum */}
      {wallet.balanceCents < 500 && (
        <div>
          <div className="flex justify-between text-xs text-white/45 mb-1.5">
            <span>Verso il prelievo minimo</span>
            <span>{formatCents(wallet.balanceCents)} / €5.00</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-[var(--s-primary)]"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────

function TransactionRow({ tx, index }: { tx: Transaction; index: number }) {
  const isEarn = tx.type === "earn";
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.25 }}
      className="flex items-center gap-3 py-3 border-b border-white/6 last:border-0"
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl",
          isEarn ? "bg-green-500/12" : "bg-blue-500/12"
        )}
      >
        {isEarn ? (
          <TrendingUp size={15} className="text-green-400" />
        ) : (
          <ArrowDownToLine size={15} className="text-blue-400" />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate text-white">{tx.label}</p>
        <p className="text-xs text-white/35 flex items-center gap-1">
          {tx.status === "pending" ? (
            <><Clock size={9} className="inline" /> In attesa</>
          ) : (
            <><CheckCircle2 size={9} className="inline" /> {fmtDate(tx.timestamp)}</>
          )}
        </p>
      </div>

      {/* Amount */}
      <p className={cn("text-sm font-black tabular-nums", isEarn ? "text-green-400" : "text-blue-400")}>
        {isEarn ? "+" : "−"}{formatCents(tx.amountCents)}
      </p>
    </motion.div>
  );
}

// ── Locked state ──────────────────────────────────────────────────────────

function LockedWallet({ prizePool, onSignIn }: { prizePool?: number; onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="flex flex-col items-center"
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/12 border border-green-500/22 mb-5"
          style={{ boxShadow: "0 0 40px rgba(34,197,94,0.15)" }}
        >
          <Wallet size={34} className="text-green-400" />
        </div>

        {prizePool !== undefined && (
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--s-primary)]/10 border border-[var(--s-primary)]/20 px-3 py-1 mb-4">
            <Star size={11} className="text-[var(--s-primary)]" fill="currentColor" />
            <span className="text-xs font-black text-[var(--s-primary)]">
              {formatCents(prizePool)} in palio ora
            </span>
          </div>
        )}

        <h2 className="text-2xl font-black text-white mb-2">Portafoglio bloccato</h2>
        <p className="text-sm text-white/45 leading-relaxed max-w-[270px] mb-7">
          Accedi per gestire il tuo saldo, vedere le tue vincite e richiedere un prelievo in euro.
        </p>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onSignIn}
          className="flex items-center gap-2 rounded-2xl bg-[var(--s-primary)] px-6 py-3.5 text-sm font-black text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.32)] hover:bg-yellow-300 transition-colors min-h-[48px]"
        >
          <Sparkles size={16} />
          Accedi per guadagnare
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────

type WalletTab = "wallet" | "deals";

export function WalletView() {
  const { user, loading: authLoading } = useAuth();
  const { contest }    = useContest();
  const { isPro }      = useSubscription();
  const searchParams   = useSearchParams();
  const [authOpen, setAuthOpen]       = useState(false);
  const [wallet, setWallet]           = useState<UserWallet | null>(null);
  const [loading, setLoading]         = useState(true);
  const [amount, setAmount]           = useState("");
  const [method, setMethod]           = useState<"stripe" | "paypal">("stripe");
  const [message, setMessage]         = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy]               = useState(false);
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const [tab, setTab]                 = useState<WalletTab>("wallet");

  const transactions = useMockTransactions(wallet);

  const loadWallet = async () => {
    const { auth } = getFirebaseClient();
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    try {
      const tok = await user.getIdToken();
      const w   = await getWallet(tok);
      setWallet(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWallet(); }, []);

  // Handle redirect back from Stripe Connect onboarding
  useEffect(() => {
    const onboarding = searchParams.get("onboarding");
    if (onboarding === "success") {
      setMessage({ ok: true, text: "Account Stripe collegato! Puoi ora prelevare con Stripe." });
      loadWallet();
    } else if (onboarding === "refresh") {
      setMessage({ ok: false, text: "Onboarding Stripe non completato. Riprova per collegare il tuo account." });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const canWithdraw = wallet ? wallet.balanceCents >= 500 : false;
  const stripeConnected = !!wallet?.stripeAccountId;

  const handleStripeOnboarding = async () => {
    setOnboardingBusy(true);
    setMessage(null);
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser!.getIdToken();
      const appUrl = window.location.origin;
      const { url } = await initiateStripeOnboarding(tok, appUrl);
      window.location.href = url;
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Errore nell'avvio dell'onboarding Stripe." });
      setOnboardingBusy(false);
    }
  };

  const handleWithdraw = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents < 500) { setMessage({ ok: false, text: "Importo minimo: €5.00" }); return; }
    setBusy(true); setMessage(null);
    try {
      const { auth } = getFirebaseClient();
      const tok = await auth.currentUser!.getIdToken();
      const res = await requestWithdrawal(tok, cents, method);
      setMessage({ ok: res.success, text: res.message });
      if (res.success) { setAmount(""); loadWallet(); }
    } finally { setBusy(false); }
  };

  if (authLoading || loading) return (
    <div className="bg-slate-950 min-h-screen pt-14">
      <WalletSkeleton />
    </div>
  );

  if (!user) return (
    <>
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-950/95 px-4 pt-header pb-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Wallet className="text-[var(--s-primary)]" size={22} />
            <h1 className="text-xl font-black">Portafoglio</h1>
          </div>
        </div>
        <LockedWallet prizePool={contest?.prizePool} onSignIn={() => setAuthOpen(true)} />
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );

  if (!wallet) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
      <Wallet size={48} className="text-[var(--s-primary)]/40" />
      <p className="font-bold">Portafoglio non disponibile</p>
      <p className="text-xs text-white/40">Accumula punti nelle classifiche per sbloccare i premi.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-950/95 px-4 pt-header pb-0 backdrop-blur-xl">
        <div className="flex items-center gap-2 pb-3">
          <Wallet className="text-[var(--s-primary)]" size={22} />
          <h1 className="text-xl font-black">Portafoglio</h1>
        </div>
        {/* Tab bar */}
        <div className="flex">
          {([
            { id: "wallet" as WalletTab, label: "Saldo & Prelievo", icon: Wallet },
            { id: "deals"  as WalletTab, label: "Local Deals",       icon: Tag   },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-black transition-colors",
                tab === id ? "text-[var(--s-primary)]" : "text-white/30"
              )}
            >
              <Icon size={13} />
              {label}
              {tab === id && (
                <motion.div
                  layoutId="wallet-tab-ind"
                  className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-[var(--s-primary)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {tab === "deals" ? (
          <>
            <GoPro variant="compact" />
            <LocalDeals />
          </>
        ) : (
        <>
        {/* Prize card */}
        <PrizeCard wallet={wallet} />

        {/* Go Pro upsell for free users */}
        {!isPro && <GoPro variant="compact" />}

        {/* Withdrawal form */}
        <div className="rounded-2xl bg-white/4 border border-white/8 p-4 space-y-3">
          <h2 className="font-black text-sm">Richiedi prelievo</h2>

          {/* Method selector */}
          <div className="flex gap-2">
            {(["stripe", "paypal"] as const).map((m) => (
              <motion.button
                key={m}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 rounded-xl py-3 text-xs font-bold transition-colors min-h-[44px]",
                  method === m
                    ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                    : "bg-white/6 border border-transparent text-white/40 hover:text-white/60"
                )}
              >
                {m === "stripe" ? "💳 Stripe" : "🅿️ PayPal"}
                {m === "stripe" && stripeConnected && (
                  <span className="ml-1 text-green-400 text-xs">✓</span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Stripe Connect onboarding — shown when Stripe is selected but not connected */}
          {method === "stripe" && !stripeConnected && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-3.5 space-y-2.5"
            >
              <div className="flex items-start gap-2">
                <CreditCard size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-300">Collega il tuo account Stripe</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Per ricevere pagamenti via Stripe devi completare la verifica una sola volta.
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleStripeOnboarding}
                disabled={onboardingBusy}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-xs font-black text-white hover:bg-blue-400 transition-colors disabled:opacity-60 min-h-[44px]"
              >
                {onboardingBusy ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <ExternalLink size={13} />
                )}
                {onboardingBusy ? "Reindirizzamento…" : "Collega account Stripe"}
              </motion.button>
            </motion.div>
          )}

          {/* Amount input — only shown when payout method is ready */}
          {(method === "paypal" || stripeConnected) && (
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">€</span>
              <input
                type="number"
                min="5"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={!canWithdraw}
                className="w-full rounded-xl bg-white/6 border border-white/10 pl-8 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 disabled:opacity-40"
              />
            </div>
          )}

          {/* Error/success message */}
          {message && (
            <p className={cn(
              "text-xs rounded-xl px-3 py-2.5",
              message.ok ? "bg-green-500/12 text-green-400" : "bg-red-500/10 text-red-400"
            )}>
              {message.text}
            </p>
          )}

          {/* Withdraw button — only shown when payout method is ready */}
          {(method === "paypal" || stripeConnected) && (
            <motion.button
              whileTap={canWithdraw && !busy ? { scale: 0.95 } : {}}
              onClick={handleWithdraw}
              disabled={busy || !amount || !canWithdraw}
              className={cn(
                "relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-black",
                "flex items-center justify-center gap-2",
                "transition-colors duration-200 min-h-[48px]",
                canWithdraw && !busy
                  ? "bg-blue-500 text-white hover:bg-blue-400 shadow-[0_4px_16px_rgba(59,130,246,0.35)]"
                  : "bg-white/8 text-white/30 cursor-not-allowed"
              )}
            >
              {!canWithdraw && <Lock size={14} />}
              <ArrowDownToLine size={15} />
              {busy ? "Elaborazione…" : canWithdraw ? "Preleva ora" : "Saldo insufficiente"}
            </motion.button>
          )}

          <p className="text-xs text-white/25 text-center">
            Prelievo minimo €5 · Elaborato in 1–3 giorni lavorativi
          </p>
        </div>

        {/* Transaction history */}
        {transactions.length > 0 && (
          <div className="rounded-2xl bg-white/4 border border-white/8 p-4">
            <h2 className="font-black text-sm mb-1">Cronologia</h2>
            <div>
              {transactions.map((tx, idx) => (
                <TransactionRow key={tx.id} tx={tx} index={idx} />
              ))}
            </div>
          </div>
        )}
        </>
        )}

      </div>
    </div>
  );
}

