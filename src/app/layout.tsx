import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/InstallPrompt";

// Wszystkie trzy fonty mają subset latin-ext (Ą Ć Ę Ł Ń Ó Ś Ź Ż) — SPEC §6.2.
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Domówka",
  description: "Imprezowe gry na jeden wieczór. Każdy na swoim telefonie.",
  manifest: "/manifest.webmanifest",
  applicationName: "Domówka",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Domówka" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  other: {
    // theme-color w dwóch wariantach (UPGRADE.md §B1). Next.js Metadata API nie obsługuje
    // media query na themeColor, więc dodajemy ręcznie w <head> poniżej.
  },
};

export const viewport: Viewport = {
  // theme-color z media query dodane w <head> ręcznie (patrz poniżej).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B0A12" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0A12" },
  ],
  width: "device-width",
  initialScale: 1,
  // UPGRADE.md §B4: user-scalable=no tylko na ekranach gry, nie globalnie.
  // Usunięto maximumScale i userScalable z globalnego layoutu.
  viewportFit: "cover", // env(safe-area-inset-*) na notchu
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${chakraPetch.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        {children}
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
