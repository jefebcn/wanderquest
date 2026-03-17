import type { Metadata } from "next";
import { ProfileView } from "@/components/features/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profilo",
  description: "Il tuo profilo WanderQuest — saldo, badge e cronologia scan.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
