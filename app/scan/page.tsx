"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScannerView } from "@/components/features/scanner/ScannerView";
import { ARView } from "@/components/features/ar/ARView";
import { Camera } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [showAR, setShowAR] = useState(false);

  // Redirect to onboarding if first visit
  useEffect(() => {
    if (typeof window !== "undefined") {
      const onboarded = localStorage.getItem("wq_onboarded");
      if (!onboarded) {
        router.replace("/onboarding");
      }
    }
  }, [router]);

  if (showAR) {
    return <ARView onClose={() => setShowAR(false)} />;
  }

  return (
    <div className="relative min-h-screen bg-[#080C1A]">
      <ScannerView />

      {/* AR toggle FAB */}
      <button
        onClick={() => setShowAR(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 shadow-lg shadow-amber-400/30 text-[#080C1A] active:scale-95 transition-transform"
        aria-label="Apri vista AR"
      >
        <Camera size={24} />
      </button>
    </div>
  );
}
