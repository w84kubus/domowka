import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { codeParamSchema } from "@/lib/schemas/room";
import { pickNewHost, isConnected } from "@/lib/server/rooms";
import type { Room } from "@/lib/types/room";

export const runtime = "nodejs";

// C1 (UPGRADE.md §C1): migracja hosta na rozłączeniu.
// Gdy host nie pingował >30 s, dowolny gracz, który pinguje, wyzwala migrację.
const HOST_MIGRATE_AFTER_MS = 30_000;

// E1: debounce zapisu ping — nie piszemy do room doc jeśli gracz pingował < 10 s temu.
// Zmniejsza snapshot reads (każdy zapis → read per listener).
const PING_DEBOUNCE_MS = 10_000;

// POST /api/rooms/[code]/ping — obecność (SPEC §3.7). Klient strzela co 5 s.
// Aktualizujemy lastSeenAt + connected gracza; sprawdzamy migrację hosta.
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

    const update: Record<string, unknown> = {};

    // C1: Migracja hosta — host rozłączony >30 s → przejdź na najstarszego gracza.
    const host = room.players[room.hostUid];
    if (host && room.hostUid !== uid && !isConnected(host, now) && now - host.lastSeenAt > HOST_MIGRATE_AFTER_MS) {
      const nextHost = pickNewHost(room.players, room.seatOrder, room.hostUid, now);
      if (nextHost) {
        update.hostUid = nextHost;
        update[`players.${nextHost}.isHost`] = true;
        update[`players.${room.hostUid}.isHost`] = false;
      }
    }

    // E1: debounce — piszemy lastSeenAt tylko jeśli minęło >10 s lub status się zmienił.
    const me = room.players[uid];
    const stale = now - me.lastSeenAt >= PING_DEBOUNCE_MS;
    const reconnecting = !me.connected;
    if (stale || reconnecting) {
      update[`players.${uid}.lastSeenAt`] = now;
      update[`players.${uid}.connected`] = true;
    }

    // Pomijamy zapis jeśli nic się nie zmieniło — zero triggerów snapshotów.
    if (Object.keys(update).length > 0) {
      await ref.update(update);
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
