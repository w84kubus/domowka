import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { ApiError, requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { newPlayer, newRoom } from "@/lib/server/rooms";
import { createRoomSchema } from "@/lib/schemas/room";
import { generateRoomCode } from "@/lib/room-code";

export const runtime = "nodejs"; // firebase-admin (SPEC §8)

const MAX_CODE_ATTEMPTS = 10;

// POST /api/rooms — zakłada nowy pokój, tworzy hosta z tożsamości z tokenu.
export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    const body = await req.json().catch(() => ({}));
    const { nick, avatar } = createRoomSchema.parse(body);

    const db = getAdminDb();
    const now = Date.now();
    const host = newPlayer(uid, nick, avatar, now, true);

    // Kolizja kodu → losuj ponownie. create() rzuca ALREADY_EXISTS jeśli kod zajęty.
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateRoomCode();
      try {
        await db.doc(`rooms/${code}`).create(newRoom(code, host, now));
        return NextResponse.json({ code });
      } catch (err: unknown) {
        const code6 = (err as { code?: number })?.code;
        if (code6 === 6 /* ALREADY_EXISTS */) continue;
        throw err;
      }
    }
    throw new ApiError(503, "Nie udało się wylosować wolnego kodu. Spróbuj ponownie.");
  } catch (err) {
    return handleApiError(err);
  }
}
