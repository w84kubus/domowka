import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { ApiError, requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { pickNewHost } from "@/lib/server/rooms";
import { codeParamSchema } from "@/lib/schemas/room";
import type { Room } from "@/lib/types/room";

export const runtime = "nodejs";

// POST /api/rooms/[code]/leave — wyjście gracza albo wyrzucenie przez hosta ({ targetUid }).
// Obsługuje migrację hosta (SPEC §3.7) i sprząta pusty pokój.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  try {
    const uid = await requireUid(req);
    const code = codeParamSchema.parse((await ctx.params).code);
    const body = await req.json().catch(() => ({}));
    const targetUid: string = typeof body?.targetUid === "string" ? body.targetUid : uid;

    const db = getAdminDb();
    const ref = db.doc(`rooms/${code}`);
    const now = Date.now();

    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) return; // już nie istnieje — nic do roboty
      const room = snap.data() as Room;

      // Wyrzucać kogoś innego może tylko host (SPEC §4).
      if (targetUid !== uid && room.hostUid !== uid) {
        throw new ApiError(403, "Tylko host może wyrzucić gracza.");
      }
      if (!room.players[targetUid]) return;

      const remaining = Object.keys(room.players).filter((u) => u !== targetUid);
      if (remaining.length === 0) {
        t.delete(ref); // ostatni gracz wyszedł — kasujemy pokój
        return;
      }

      const update: Record<string, unknown> = {
        [`players.${targetUid}`]: FieldValue.delete(),
        version: room.version + 1,
      };

      // Migracja hosta, jeśli wychodzi obecny host.
      if (room.hostUid === targetUid) {
        const nextHost = pickNewHost(room.players, room.seatOrder, targetUid, now);
        if (nextHost) {
          update.hostUid = nextHost;
          update[`players.${nextHost}.isHost`] = true;
        }
      }

      t.update(ref, update);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
