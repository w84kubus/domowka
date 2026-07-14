import { NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { startGame } from "@/lib/server/game-runner";
import { codeParamSchema } from "@/lib/schemas/room";

export const runtime = "nodejs";

// POST /api/rooms/[code]/start — host uruchamia grę { gameId, settings }.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const uid = await requireUid(req);
    const code = codeParamSchema.parse((await ctx.params).code);
    const body = await req.json().catch(() => ({}));
    if (typeof body?.gameId !== "string") {
      return NextResponse.json({ error: "Brak gameId." }, { status: 400 });
    }
    await startGame(code, uid, body.gameId, body.settings, Date.now());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
