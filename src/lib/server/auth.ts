import "server-only";
import { getAdminAuth } from "@/lib/firebase/admin";

/** Błąd z kodem HTTP — łapany w Route Handlerach i mapowany na odpowiedź. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Weryfikuje Firebase ID token z nagłówka Authorization: Bearer <token>.
 * Zwraca uid. Każda akcja z klienta musi przejść przez tę bramkę (SPEC §3.1).
 */
export async function requireUid(req: Request): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) {
    throw new ApiError(401, "Brak tokenu uwierzytelnienia.");
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1]);
    return decoded.uid;
  } catch {
    throw new ApiError(401, "Nieprawidłowy token uwierzytelnienia.");
  }
}
