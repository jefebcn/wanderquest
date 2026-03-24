"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, RefreshCw, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

interface Rates {
  [currency: string]: number;
}

const CURRENCIES = [
  { code: "USD", flag: "🇺🇸", name: "Dollaro USA" },
  { code: "GBP", flag: "🇬🇧", name: "Sterlina" },
  { code: "JPY", flag: "🇯🇵", name: "Yen giapponese" },
  { code: "CHF", flag: "🇨🇭", name: "Franco svizzero" },
  { code: "AUD", flag: "🇦🇺", name: "Dollaro australiano" },
  { code: "CAD", flag: "🇨🇦", name: "Dollaro canadese" },
  { code: "CNY", flag: "🇨🇳", name: "Yuan cinese" },
  { code: "BRL", flag: "🇧🇷", name: "Real brasiliano" },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]["code"];

function useExchangeRates() {
  const [rates, setRates]       = useState<Rates | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const symbols = CURRENCIES.map((c) => c.code).join(",");
      const res  = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${symbols}`);
      const data = await res.json();
      setRates(data.rates as Rates);
      setUpdatedAt(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { rates, loading, error, updatedAt, refresh: fetch_ };
}

export function CurrencyConverter() {
  const { rates, loading, error, updatedAt, refresh } = useExchangeRates();
  const [amount, setAmount]   = useState("100");
  const [selected, setSelected] = useState<CurrencyCode>("USD");

  const numAmount = parseFloat(amount) || 0;

  const convertedValue = (code: string) => {
    if (!rates || !rates[code] || !numAmount) return null;
    return (numAmount * rates[code]).toLocaleString("it-IT", {
      minimumFractionDigits: code === "JPY" || code === "CNY" ? 0 : 2,
      maximumFractionDigits: code === "JPY" || code === "CNY" ? 0 : 2,
    });
  };

  return (
    <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15">
            <ArrowRightLeft size={14} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Convertitore Valute</h3>
            {updatedAt && (
              <p className="text-xs text-white/30">
                Aggiornato {updatedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
        <motion.button
          whileTap={{ rotate: 180, scale: 0.9 }}
          onClick={refresh}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/6 hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={12} className={cn("text-white/40", loading && "animate-spin")} />
        </motion.button>
      </div>

      {/* EUR Input */}
      <div className="px-4 py-3 border-b border-white/6">
        <p className="text-xs font-bold uppercase tracking-widest text-white/35 mb-2">Importo in EUR</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-[var(--s-primary)]">€</span>
          <input
            type="number"
            min="0"
            step="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            className="w-full rounded-xl bg-white/6 border border-white/10 pl-8 pr-4 py-3 text-xl font-black text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Rates grid */}
      <div className="p-4">
        {error ? (
          <div className="text-center py-4">
            <p className="text-xs text-red-400/70">Impossibile caricare i tassi di cambio.</p>
            <button onClick={refresh} className="mt-2 text-xs text-blue-400 underline">Riprova</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {CURRENCIES.map(({ code, flag, name }) => {
              const converted = convertedValue(code);
              const rate = rates?.[code];
              const isSelected = selected === code;
              return (
                <motion.button
                  key={code}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelected(code as CurrencyCode)}
                  className={cn(
                    "relative flex flex-col items-start rounded-xl p-3 border text-left transition-colors",
                    isSelected
                      ? "bg-blue-500/12 border-blue-500/30"
                      : "bg-white/3 border-white/6 hover:bg-white/6"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base leading-none">{flag}</span>
                    <span className={cn("text-xs font-black", isSelected ? "text-blue-300" : "text-white/50")}>
                      {code}
                    </span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-4 w-16 rounded-lg" />
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`${code}-${amount}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-black text-white tabular-nums"
                      >
                        {converted ?? "—"}
                      </motion.p>
                    </AnimatePresence>
                  )}
                  {rate && !loading && (
                    <p className="text-xs text-white/25 mt-0.5 flex items-center gap-0.5">
                      <TrendingUp size={8} />1€ = {rate.toFixed(code === "JPY" ? 0 : 4)} {code}
                    </p>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-white/20 text-center mt-3">
          Tassi indicativi · Fonte: Frankfurter (BCE) · Non per uso finanziario
        </p>
      </div>
    </div>
  );
}
