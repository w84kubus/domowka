import { NextResponse } from "next/server";

// firebase-admin nie działa na Edge — każdy Route Handler musi być na nodejs (SPEC §8).
// /api/time nie używa admina, ale trzymamy tę samą konwencję wszędzie.
export const runtime = "nodejs";

// Klienci używają tego do korekty zegara (SPEC §3.6): zegary telefonów bywają
// rozjechane o kilkadziesiąt sekund, więc odliczanie liczymy względem czasu serwera.
export function GET() {
  return NextResponse.json(
    { now: Date.now() },
    { headers: { "cache-control": "no-store" } },
  );
}
