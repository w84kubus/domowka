import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ConnectionBar } from "@/components/ConnectionBar";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n/provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/types";

// Arcade Party (DESIGN.md §1). Wszystkie fonty z latin-ext (Ą Ć Ę Ł Ń Ó Ś Ź Ż).
// Display: Baloo 2, nie Fredoka. Fredoka ma glify latin-ext, ale rysuje ogonek (Ą Ę)
// cienkim włosem i odsuwa kreskę (Ź Ć Ń Ś) — diakrytyki nie trzymają wagi pisma.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
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
    { media: "(prefers-color-scheme: light)", color: "#140A24" },
    { media: "(prefers-color-scheme: dark)", color: "#140A24" },
  ],
  width: "device-width",
  initialScale: 1,
  // UPGRADE.md §B4: user-scalable=no tylko na ekranach gry, nie globalnie.
  // Usunięto maximumScale i userScalable z globalnego layoutu.
  viewportFit: "cover", // env(safe-area-inset-*) na notchu
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Język z ciasteczka — czytany na serwerze, żeby pierwszy render był już właściwy.
  // Bez tego serwer dałby polski, klient natychmiast angielski: niezgodność hydratacji
  // i mignięcie złym językiem u każdego, kto nie gra po polsku.
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    // Zmienne fontów muszą siedzieć na <html>: @theme deklaruje --font-display
    // na :root, więc var(--font-baloo) musi się tam podstawić.
    <html
      lang={locale}
      className={`${baloo.variable} ${nunito.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-frame text-ink font-body">
        <I18nProvider initial={locale}>
          <ConnectionBar />
          {children}
          <InstallPrompt />
          <ServiceWorkerRegister />
        </I18nProvider>
      </body>
    </html>
  );
}
