import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

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
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0A12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // SPEC §6.5
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
