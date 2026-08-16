/// <reference lib="webworker" />
// Service worker (Faza B, UPGRADE.md §B2).
// Strategie: NetworkFirst dla HTML, CacheFirst dla fontów/ikon, StaleWhileRevalidate dla statyków.
// WAŻNE: /api/* i Firebase NIGDY nie są cache'owane — stan gry musi być zawsze świeży.
import { defaultCache } from "@serwist/next/worker";
import {
  type PrecacheEntry,
  Serwist,
  type RuntimeCaching,
  NetworkOnly,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

// Domeny Firebase i Google, których SW nie dotyka.
const FIREBASE_DOMAINS = [
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "fcmregistrations.googleapis.com",
  "firebase.googleapis.com",
];

// Filtrujemy defaultCache: usuwamy reguły, które cache'ują /api/* lub cross-origin.
// Nasze API to wyłącznie POST (Route Handlery), więc i tak nie łapią się na GET cache,
// ale dla pewności wymuszamy NetworkOnly na /api/*.
const filteredCache: RuntimeCaching[] = defaultCache.filter((entry) => {
  // Usuń domyślną regułę "apis" (cache'uje GET /api/*)
  if ("cacheName" in (entry.handler ?? {}) && (entry.handler as { cacheName?: string }).cacheName === "apis") {
    return false;
  }
  return true;
});

// Dodaj explicit NetworkOnly dla /api/* PRZED resztą.
const runtimeCaching: RuntimeCaching[] = [
  // /api/* — NIGDY nie cache'uj
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  // Firebase / Google — NIGDY nie cache'uj
  {
    matcher: ({ url }) => FIREBASE_DOMAINS.some((d) => url.hostname.includes(d)),
    handler: new NetworkOnly(),
  },
  ...filteredCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    concurrency: 10,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  // Offline fallback — serwowany gdy nawigacja nie pójdzie przez sieć.
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
