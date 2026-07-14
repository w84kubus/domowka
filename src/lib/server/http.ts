import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "./auth";

/** Mapuje wyjątki na odpowiedź JSON: ApiError → jego status, ZodError → 400, reszta → 500. */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err && typeof err === "object" && "issues" in err) {
    return NextResponse.json(
      { error: "Nieprawidłowe dane.", issues: (err as { issues: unknown }).issues },
      { status: 400 },
    );
  }
  console.error(err);
  return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
}
