import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { ApiError, requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { codeParamSchema } from "@/lib/schemas/room";
import type { Room } from "@/lib/types/room";

export const runtime = "nodejs";

// POST /api/rooms/[code]/reset — host wraca z gry do lobby („Jeszcze raz" / zmiana gry).
// C2: operacja w transakcji (usunięcie secret + update pokoju) — bez race condition.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const uid = await requireUid(req);
    const code = codeParamSchema.parse((await ctx.params).code);
    const db = getAdminDb();
    const ref = db.doc(`rooms/${code}`);

    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) throw new ApiError(404, "Nie ma pokoju.");
      const room = snap.data() as Room;
      if (room.hostUid !== uid) throw new ApiError(403, "Tylko host może wrócić do lobby.");

      t.delete(ref.collection("secret").doc("state"));
      t.update(ref, {
        status: "lobby",
        gameId: null,
        publicState: {},
        phase: "lobby",
        phaseEndsAt: null,
        phaseStartedAt: null,
        seatOrder: [],
        round: 0,
        version: FieldValue.increment(1),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
