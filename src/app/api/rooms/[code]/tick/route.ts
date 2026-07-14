import { NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { tickGame } from "@/lib/server/game-runner";
import { codeParamSchema } from "@/lib/schemas/room";

export const runtime = "nodejs";

// POST /api/rooms/[code]/tick — klient zauważył lokalnie, że faza wygasła (SPEC §3.5).
// Serwer sprawdza SWOIM zegarem. Wygasła → PHASE_TIMEOUT. Nie → 204. Transakcja daje idempotencję.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    await requireUid(req);
    const code = codeParamSchema.parse((await ctx.params).code);
    const ticked = await tickGame(code, Date.now());
    if (!ticked) return new NextResponse(null, { status: 204 });
    return NextResponse.json({ ticked: true });
  } catch (err) {
    return handleApiError(err);
  }
}
