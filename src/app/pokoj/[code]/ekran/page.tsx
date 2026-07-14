"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoomCodeNeon } from "@/components/RoomCodeNeon";
import { RoomQr } from "@/components/RoomQr";
import { useAnonAuth } from "@/hooks/useAnonAuth";
import { useServerClock } from "@/hooks/useServerClock";
import { useRoom } from "@/hooks/useRoom";
import { apiPost } from "@/lib/client/api";
import { normalizeRoomCode } from "@/lib/room-code";
import { DISCONNECT_AFTER_MS } from "@/lib/types/room";

// Ekran hosta (SPEC §3.9): wspólny ekran na TV. „Co widzą wszyscy" — wielki kod + QR + gracze.
// Ekran udaje stary telewizor (CRT §6.1). Nie jest graczem: rejestruje się jako obserwator,
// dzięki czemu reguły Firestore wpuszczają go do odczytu pokoju.
export default function EkranPage() {
  const params = useParams<{ code: string }>();
  const code = normalizeRoomCode(params.code ?? "");
  const { uid, loading: authLoading } = useAnonAuth();
  const { serverNow } = useServerClock();

  const [observing, setObserving] = useState(false);
  useEffect(() => {
    if (authLoading || !uid) return;
    let active = true;
    apiPost(`/api/rooms/${code}/observe`)
      .then(() => active && setObserving(true))
      .catch(() => active && setObserving(true)); // i tak spróbuj czytać
    return () => {
      active = false;
    };
  }, [uid, authLoading, code]);

  const { room, notFound } = useRoom(code, observing);

  if (notFound) {
    return (
      <main className="screen items-center justify-center">
        <p className="text-2xl text-[var(--color-tekst-drugi)]">Nie ma takiego pokoju.</p>
      </main>
    );
  }

  const now = serverNow();
  const players = room ? Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt) : [];

  return (
    <main className="crt screen items-center gap-10 pt-10 text-center">
      <div className="crt-scanlines" aria-hidden />
      <header className="flex flex-col items-center gap-3">
        <span className="text-lg uppercase tracking-[0.3em] text-[var(--color-tekst-drugi)]">
          Dołącz do pokoju
        </span>
        <RoomCodeNeon code={code} size="6rem" accent="#22d3ee" />
      </header>

      <RoomQr code={code} size={220} />

      <section className="w-full max-w-3xl">
        <h2 className="mb-4 text-xl uppercase tracking-widest text-[var(--color-tekst-drugi)]">
          Gracze ({players.length})
        </h2>
        <ul className="flex flex-wrap justify-center gap-4">
          {players.map((p) => {
            const connected = now - p.lastSeenAt < DISCONNECT_AFTER_MS;
            return (
              <li
                key={p.uid}
                className="card flex flex-col items-center gap-1 px-6 py-4"
                style={{ opacity: connected ? 1 : 0.4 }}
              >
                <span className="text-4xl">{p.avatar}</span>
                <span className="font-semibold">{p.nick}</span>
                {p.uid === room?.hostUid && (
                  <span className="text-xs text-[var(--color-bursztyn)]">★ host</span>
                )}
              </li>
            );
          })}
        </ul>
        {players.length === 0 && (
          <p className="text-[var(--color-tekst-drugi)]">Czekamy na graczy…</p>
        )}
      </section>
    </main>
  );
}
