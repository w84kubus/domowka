import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nie pakuj firebase-admin do bundla funkcji serverless — jego zależność `jose`
  // jest ESM-only i po zbundlowaniu do CommonJS wywala się na Vercelu (ERR_REQUIRE_ESM
  // w jwks-rsa przy verifyIdToken). Zostawiamy go jako zewnętrzny require z node_modules.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
