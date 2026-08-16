import { NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { applyAction } from "@/lib/server/game-runner";
import { codeParamSchema } from "@/lib/schemas/room";

export const runtime = "nodejs";

// POST /api/rooms/[code]/action — akcja gracza w grze { action: {...}, actionId?: string }.
// C2: actionId opcjonalne — jeśli podane, serwer odrzuca duplikat (409).
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const uid = await requireUid(req);
    const code = codeParamSchema.parse((await ctx.params).code);
    const body = await req.json().catch(() => ({}));
    const actionId = typeof body?.actionId === "string" ? body.actionId : undefined;
    await applyAction(code, uid, body?.action, Date.now(), actionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
