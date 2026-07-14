"use client";
import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoomCodeNeon } from "@/components/RoomCodeNeon";
import { RoomQr } from "@/components/RoomQr";
import { PlayerList } from "@/components/PlayerList";
import { useAnonAuth } from "@/hooks/useAnonAuth";
import { useServerClock } from "@/hooks/useServerClock";
import { useRoom } from "@/hooks/useRoom";
import { usePresence } from "@/hooks/usePresence";
import { apiPost } from "@/lib/client/api";
import { normalizeRoomCode } from "@/lib/room-code";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = normalizeRoomCode(params.code ?? "");

  const { uid, loading: authLoading } = useAnonAuth();
  const { serverNow } = useServerClock();
  const { room, loading, error, notFound } = useRoom(code, !authLoading && !!uid);

  const amMember = !!(uid && room?.players[uid]);
  usePresence(code, amMember);

  // Rozróżniamy „nigdy nie dołączył" (→ ekran dołączania) od „wyrzucony/wyszedł" (→ start).
  const wasMemberRef = useRef(false);
  useEffect(() => {
    if (amMember) wasMemberRef.current = true;
  }, [amMember]);

  useEffect(() => {
    if (loading || authLoading) return;
    if (notFound) return;
    if (room && uid && !room.players[uid]) {
      router.replace(wasMemberRef.current ? "/" : `/p/${code}`);
    }
    // Utrata dostępu do odczytu po wyrzuceniu objawia się błędem reguł.
    if (error && wasMemberRef.current) router.replace("/");
  }, [room, uid, loading, authLoading, notFound, error, code, router]);

  const leave = async () => {
    try {
      await apiPost(`/api/rooms/${code}/leave`);
    } catch {
      /* i tak wychodzimy */
    }
    router.push("/");
  };

  const kick = async (targetUid: string) => {
    try {
      await apiPost(`/api/rooms/${code}/leave`, { targetUid });
    } catch {
      /* ignoruj — snapshot pokaże aktualny stan */
    }
  };

  if (notFound) {
    return (
      <main className="screen items-center justify-center gap-6 text-center">
        <p className="text-lg">Nie ma pokoju o kodzie</p>
        <RoomCodeNeon code={code} accent="#ff2d95" />
        <Link href="/dolacz" className="btn">
          Spróbuj innego kodu
        </Link>
      </main>
    );
  }

  if (loading || authLoading || !room) {
    return (
      <main className="screen items-center justify-center">
        <p className="text-[var(--color-tekst-drugi)]">Wchodzę do pokoju…</p>
      </main>
    );
  }

  const isHost = uid === room.hostUid;
  const playerCount = Object.keys(room.players).length;

  return (
    <main className="screen gap-8">
      <header className="flex flex-col items-center gap-2 pt-2">
        <span className="text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">
          Pokój
        </span>
        <RoomCodeNeon code={room.code} />
      </header>

      <section className="flex flex-col items-center gap-3">
        <RoomQr code={room.code} />
        <p className="text-center text-sm text-[var(--color-tekst-drugi)]">
          Zeskanuj albo podaj kod znajomym.
        </p>
        <Link
          href={`/pokoj/${room.code}/ekran`}
          target="_blank"
          className="text-sm text-[var(--color-cyjan)] underline underline-offset-4"
        >
          Otwórz ekran hosta (na TV) ↗
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">
          Gracze ({playerCount})
        </h2>
        <PlayerList
          players={room.players}
          hostUid={room.hostUid}
          myUid={uid}
          serverNow={serverNow}
          onKick={isHost ? kick : undefined}
        />
      </section>

      <section className="mt-auto flex flex-col gap-3">
        {isHost ? (
          <>
            <button type="button" className="btn btn-accent" disabled title="Gry pojawią się w Fazie 2">
              Zaczynamy (gry w Fazie 2)
            </button>
            <p className="text-center text-xs text-[var(--color-tekst-drugi)]">
              Jesteś hostem. Wybór gry i ustawienia dojdą w kolejnej fazie.
            </p>
          </>
        ) : (
          <p className="text-center text-sm text-[var(--color-tekst-drugi)]">
            Czekamy, aż host rozpocznie grę.
          </p>
        )}
        <button type="button" onClick={leave} className="btn">
          Wyjdź z pokoju
        </button>
      </section>
    </main>
  );
}
