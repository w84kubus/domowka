import "server-only";

// Firebase Admin SDK — TYLKO na serwerze (Route Handlery). To jedyna droga do zapisu
// stanu gry i do secret/state (SPEC §3.1). Klient nie ma tu dostępu.
//
// Singleton z guardem na getApps().length: w środowisku serverless nie wolno
// inicjalizować aplikacji przy każdym requeście (SPEC §8, pkt 2).
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { parseServiceAccountKey } from "./service-account";

export function getAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];
  const serviceAccount = parseServiceAccountKey(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "",
  );
  return initializeApp({ credential: cert(serviceAccount) });
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
