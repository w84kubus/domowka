import { NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { applyAction } from "@/lib/server/game-runner";
import { codeParamSchema } from "@/lib/schemas/room";

export const runtime = "nodejs";

// POST /api/rooms/[code]/action — akcja gracza w grze { action: {...} }.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const uid = await requireUid(req);
    const code = codeParamSchema.parse((await ctx.params).code);
    const body = await req.json().catch(() => ({}));
    await applyAction(code, uid, body?.action, Date.now());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
