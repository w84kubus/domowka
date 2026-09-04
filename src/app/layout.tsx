import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { ConnectionBar } from "@/components/ConnectionBar";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n/provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/types";
import { SITE_URL } from "@/lib/site";
import { translate } from "@/lib/i18n/dict";

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

// Kartę linku budujemy w języku czytelnika. Link do pokoju wkleja się do czatu
// grupowego i to on jest pierwszym kontaktem z aplikacją — obrazek bierze się
// automatycznie z src/app/opengraph-image.jpg (konwencja Next.js).
export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  // Opis dla wyszukiwarki jest inny niż hasło na stronie: hasło ma być krótkie
  // i chwytliwe, opis w wynikach ma wymieniać gry, bo to po ich nazwach ludzie
  // szukają („mafia online", „wisielec ze znajomymi").
  const description = translate(locale, "meta.description");

  return {
    metadataBase: new URL(SITE_URL),
    // Tytuł zaczyna się od tego, czego ludzie szukają, a nie od marki, której
    // jeszcze nikt nie zna. Podstrony dostają „X | Doplay" przez szablon.
    title: { default: translate(locale, "meta.title"), template: "%s | Doplay" },
    description,
    alternates: { canonical: "/" },
    manifest: "/manifest.webmanifest",
    applicationName: "Doplay",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Doplay" },
    icons: {
      icon: [
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      siteName: "Doplay",
      title: translate(locale, "meta.title"),
      description,
      url: SITE_URL,
      locale: locale === "pl" ? "pl_PL" : "en_US",
    },
    twitter: { card: "summary_large_image", title: translate(locale, "meta.title"), description },
  };
}

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
        {/* Dane strukturalne. WebApplication, nie WebSite: to jest aplikacja, w którą
            się gra w przeglądarce, a nie serwis z treścią. Kategoria GameApplication
            i jawna cena 0 pozwalają wyszukiwarce pokazać ją jako darmową grę.
            Nie deklarujemy ocen ani opinii, bo ich nie mamy, a wymyślone łamią
            wytyczne Google i potrafią skończyć się karą. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Doplay",
              url: SITE_URL,
              applicationCategory: "GameApplication",
              operatingSystem: "Web",
              browserRequirements: "Wymaga JavaScript",
              inLanguage: ["pl", "en"],
              description: translate(locale, "meta.description"),
              offers: { "@type": "Offer", price: "0", priceCurrency: "PLN" },
              author: { "@type": "Person", name: "Jakub Bondel", url: "https://github.com/w84kubus" },
            }),
          }}
        />
        <I18nProvider initial={locale}>
          <ConnectionBar />
          {children}
          <InstallPrompt />
          <PrivacyNotice />
          <ServiceWorkerRegister />
        </I18nProvider>
      </body>
    </html>
  );
}
