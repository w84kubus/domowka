import type { ServiceAccount } from "firebase-admin/app";

/**
 * Dekoduje FIREBASE_SERVICE_ACCOUNT_KEY (base64 z JSON-a klucza konta serwisowego, SPEC §7)
 * do postaci ServiceAccount dla Admin SDK. Czysta funkcja — testowalna, bez I/O.
 */
export function parseServiceAccountKey(rawBase64: string): ServiceAccount {
  if (!rawBase64) {
    throw new Error(
      "Brak FIREBASE_SERVICE_ACCOUNT_KEY. Ustaw zmienną (base64 z JSON klucza konta serwisowego).",
    );
  }
  const json = Buffer.from(rawBase64, "base64").toString("utf8");
  const parsed = JSON.parse(json) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY nie zawiera project_id / client_email / private_key.",
    );
  }
  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key,
  };
}
