import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:  "WanderQuest",
    template: "%s | WanderQuest",
  },
  description: "Esplora monumenti, guadagna punti, vinci premi reali.",
  manifest:    "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "WanderQuest" },
  icons: {
    icon:  "/icons/icon-192.png",
    apple: "/icons/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor:  "#020617",
  initialScale: 1,
  width:       "device-width",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="font-sans bg-slate-950 text-white antialiased">
        <main className="relative min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
