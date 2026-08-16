import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  swUrl: "/sw.js",
  // Nie rejestruj automatycznie — mamy własny komponent z lepszą kontrolą.
  register: false,
  // Nie cache'uj nawigacji w SW entry worker — stan gry musi iść przez sieć.
  cacheOnNavigation: false,
  // Wyłącz w dev — SW przeszkadza w HMR.
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Trasowanie plików liczymy względem katalogu projektu (w domu bywa lockfile wyżej).
  outputFileTracingRoot: __dirname,
  // Nie pakuj firebase-admin do bundla funkcji serverless — jego zależność `jose`
  // jest ESM-only i po zbundlowaniu do CommonJS wywala się na Vercelu (ERR_REQUIRE_ESM
  // w jwks-rsa przy verifyIdToken). Zostawiamy go jako zewnętrzny require z node_modules.
  serverExternalPackages: ["firebase-admin"],
};

export default withSerwist(nextConfig);
