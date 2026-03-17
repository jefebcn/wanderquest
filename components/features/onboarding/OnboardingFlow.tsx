"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Trophy, Headphones, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: ScanLine,
    title: "Scansiona i monumenti",
    description:
      "Avvicinati a un monumento storico, premi 'Check-in' e guadagna punti verificati via GPS. Nessun codice QR, solo la tua posizione.",
    color: "from-blue-500/20 to-blue-400/10",
    iconColor: "text-blue-400",
  },
  {
    icon: Trophy,
    title: "Scala la classifica",
    description:
      "Ogni visita ti porta punti e ti avvicina al podio. I migliori esploratori si dividono il montepremi in denaro reale.",
    color: "from-amber-500/20 to-amber-400/10",
    iconColor: "text-amber-400",
  },
  {
    icon: Headphones,
    title: "Ascolta le storie",
    description:
      "Attiva la narrazione vocale per ogni monumento: storie, curiosità e aneddoti raccontati mentre esplori. Come avere una guida sempre con te.",
    color: "from-green-500/20 to-green-400/10",
    iconColor: "text-green-400",
  },
] as const;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const router          = useRouter();

  const isLast = step === STEPS.length - 1;

  const finish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wq_onboarded", "1");
    }
    router.replace("/");
  };

  const current = STEPS[step];
  const Icon    = current.icon;

  return (
    <div className="flex min-h-screen flex-col bg-[#080C1A] text-white px-6 pb-12 pt-16">
      {/* Skip */}
      <div className="flex justify-end mb-8">
        <button onClick={finish} className="text-xs text-white/30 hover:text-white/60">
          Salta
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-10">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn(
              "rounded-full transition-all duration-300",
              i === step
                ? "bg-amber-400 w-8 h-2"
                : "bg-white/20 w-2 h-2"
            )}
          />
        ))}
      </div>

      {/* Card */}
      <div className={cn("flex-1 rounded-3xl bg-gradient-to-b p-8 flex flex-col items-center text-center", current.color)}>
        <div className={cn("rounded-3xl bg-white/10 p-6 mb-8", current.iconColor)}>
          <Icon size={52} strokeWidth={1.5} />
        </div>

        <h2 className="text-2xl font-black leading-tight mb-4">{current.title}</h2>
        <p className="text-sm text-white/60 leading-relaxed">{current.description}</p>
      </div>

      {/* CTA */}
      <div className="mt-8 space-y-3">
        <button
          onClick={isLast ? finish : () => setStep((s) => s + 1)}
          className="w-full rounded-2xl bg-amber-400 py-4 font-black text-[#080C1A] text-base flex items-center justify-center gap-2"
        >
          {isLast ? "Inizia ad esplorare" : "Avanti"}
          <ChevronRight size={18} />
        </button>

        {!isLast && (
          <button onClick={finish} className="w-full text-center text-xs text-white/30 py-2">
            Salta introduzione
          </button>
        )}
      </div>
    </div>
  );
}
