import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trasowanie plików liczymy względem katalogu projektu (w domu bywa lockfile wyżej).
  outputFileTracingRoot: __dirname,
  // Nie pakuj firebase-admin do bundla funkcji serverless — jego zależność `jose`
  // jest ESM-only i po zbundlowaniu do CommonJS wywala się na Vercelu (ERR_REQUIRE_ESM
  // w jwks-rsa przy verifyIdToken). Zostawiamy go jako zewnętrzny require z node_modules.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
