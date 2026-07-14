import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { codeParamSchema } from "@/lib/schemas/room";
import type { Room } from "@/lib/types/room";

export const runtime = "nodejs";

// POST /api/rooms/[code]/ping — obecność (SPEC §3.7). Klient strzela co 5 s.
// Aktualizujemy tylko lastSeenAt + connected gracza; NIE ruszamy version (to nie akcja gry).
export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  try {
    const uid = await requireUid(req);
    const code = codeParamSchema.parse((await ctx.params).code);
    const db = getAdminDb();
    const ref = db.doc(`rooms/${code}`);
    const now = Date.now();

    const snap = await ref.get();
    if (!snap.exists) return new NextResponse(null, { status: 204 });
    const room = snap.data() as Room;
    if (!room.players[uid]) return new NextResponse(null, { status: 204 });

    await ref.update({
      [`players.${uid}.lastSeenAt`]: now,
      [`players.${uid}.connected`]: true,
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
