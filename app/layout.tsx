import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default:  "WanderQuest",
    template: "%s | WanderQuest",
  },
  description: "Esplora monumenti, guadagna punti, vinci premi reali.",
  manifest:    "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "WanderQuest" },
  icons: {
    icon:  "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor:    "#020617",
  initialScale:  1,
  width:         "device-width",
  viewportFit:   "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      {/* Google Fonts loaded via CDN — fonts self-hosted in production */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-slate-950 text-white antialiased">
        <main className="relative min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
