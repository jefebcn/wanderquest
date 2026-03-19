import type { Metadata } from "next";
import { AdminContestPanel } from "@/components/features/admin/AdminContestPanel";

export const metadata: Metadata = {
  title: "Admin — Contest",
  description: "Gestione dei contest fotografici WanderQuest.",
};

export default function AdminContestPage() {
  return <AdminContestPanel />;
}
