import { Suspense } from "react";
import { WalletView } from "@/components/features/wallet/WalletView";

export const metadata = {
  title: "Portafoglio",
  description: "Gestisci i tuoi premi e richiedi un prelievo.",
};

export default function WalletPage() {
  return (
    <Suspense>
      <WalletView />
    </Suspense>
  );
}
