import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireUid } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/http";
import { codeParamSchema } from "@/lib/schemas/room";

export const runtime = "nodejs";

// POST /api/rooms/[code]/observe — rejestruje ekran hosta jako obserwatora (SPEC §3.9).
// Dzięki wpisowi w observers reguły Firestore pozwalają mu czytać pokój przez onSnapshot,
// mimo że nie jest graczem. Obserwator nie liczy się jako gracz, nie ma wpisu w players.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  try {
    const uid = await requireUid(req);
    const code = codeParamSchema.parse((await ctx.params).code);
    const db = getAdminDb();
    const ref = db.doc(`rooms/${code}`);

    const snap = await ref.get();
    if (!snap.exists) return new NextResponse(null, { status: 204 });

    await ref.update({ [`observers.${uid}`]: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
