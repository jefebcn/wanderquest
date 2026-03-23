import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { BottomNav }        from "@/components/layout/BottomNav";
import { PageTransition }   from "@/components/layout/PageTransition";
import { PayPalProvider }   from "@/components/providers/PayPalProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
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
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg",     sizes: "any",     type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor:      "#020617",
  width:           "device-width",
  initialScale:    1,
  maximumScale:    1,
  userScalable:    false,
  viewportFit:     "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* iOS PWA standalone — belt-and-suspenders alongside Next.js appleWebApp metadata */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans bg-slate-950 text-white antialiased">
        <PayPalProvider>
          <main className="relative min-h-screen">
            <PageTransition>{children}</PageTransition>
          </main>
          <BottomNav />
        </PayPalProvider>
      </body>
    </html>
  );
}
