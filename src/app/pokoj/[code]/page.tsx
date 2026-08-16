"use client";
import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoomCodeNeon } from "@/components/RoomCodeNeon";
import { RoomQr } from "@/components/RoomQr";
import { PlayerList } from "@/components/PlayerList";
import { GameShell } from "@/components/game/GameShell";
import { LobbyGames } from "@/components/game/LobbyGames";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ShareButton } from "@/components/ShareButton";
import { useAnonAuth } from "@/hooks/useAnonAuth";
import { useServerClock } from "@/hooks/useServerClock";
import { useRoom } from "@/hooks/useRoom";
import { usePresence } from "@/hooks/usePresence";
import { LobbySkeleton } from "@/components/LobbySkeleton";
import { apiPost } from "@/lib/client/api";
import { normalizeRoomCode } from "@/lib/room-code";
import { useSession } from "@/lib/store/session";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = normalizeRoomCode(params.code ?? "");

  const { uid, loading: authLoading } = useAnonAuth();
  const { serverNow } = useServerClock();
  const { room, loading, error, notFound } = useRoom(code, !authLoading && !!uid);
  const setActiveRoom = useSession((s) => s.setActiveRoom);

  const amMember = !!(uid && room?.players[uid]);
  usePresence(code, amMember);

  // C1: Zapamiętaj aktywny pokój, żeby dało się wrócić po odświeżeniu.
  useEffect(() => {
    if (amMember && room) {
      const nick = room.players[uid!]?.nick ?? "";
      setActiveRoom({ code: room.code, nick });
    }
  }, [amMember, room, uid, code, setActiveRoom]);

  // Rozróżniamy „nigdy nie dołączył" (→ ekran dołączania) od „wyrzucony/wyszedł" (→ start).
  const wasMemberRef = useRef(false);
  useEffect(() => {
    if (amMember) wasMemberRef.current = true;
  }, [amMember]);

  useEffect(() => {
    if (loading || authLoading) return;
    if (notFound) return;
    if (room && uid && !room.players[uid]) {
      setActiveRoom(null); // C1: wyrzucony/wyszedł — czyść sesję
      router.replace(wasMemberRef.current ? "/" : `/p/${code}`);
    }
    // Utrata dostępu do odczytu po wyrzuceniu objawia się błędem reguł.
    if (error && wasMemberRef.current) {
      setActiveRoom(null);
      router.replace("/");
    }
  }, [room, uid, loading, authLoading, notFound, error, code, router, setActiveRoom]);

  const leave = async () => {
    try {
      await apiPost(`/api/rooms/${code}/leave`);
    } catch {
      /* i tak wychodzimy */
    }
    setActiveRoom(null); // C1: czyścimy sesję przy wyjściu
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

  // Subskrypcja ostatecznie padła (po ponowieniach) — pokaż odzysk zamiast wisieć w nieskończoność.
  if (error && !wasMemberRef.current) {
    return (
      <main className="screen items-center justify-center gap-6 text-center">
        <p className="text-lg">Nie udało się wejść do pokoju.</p>
        <p className="text-sm text-[var(--color-tekst-drugi)]">Sprawdź połączenie i spróbuj ponownie.</p>
        <button type="button" className="btn btn-accent" onClick={() => window.location.reload()}>
          Spróbuj ponownie
        </button>
        <Link href="/dolacz" className="text-sm text-[var(--color-tekst-drugi)] underline underline-offset-4">
          ← wróć
        </Link>
      </main>
    );
  }

  if (loading || authLoading || !room) {
    return <LobbySkeleton />;
  }

  // Gra w toku (lub zakończona) → oddajemy ekran harnessowi gry.
  if (room.status !== "lobby" && uid) {
    return (
      <ErrorBoundary context={`game:${room.gameId} room:${code}`}>
        <GameShell room={room} meUid={uid} serverNow={serverNow} />
      </ErrorBoundary>
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
        <ShareButton code={room.code} />
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

      <section className="flex flex-col gap-3">
        <LobbyGames code={room.code} isHost={isHost} playerCount={playerCount} />
      </section>

      <section className="mt-auto pt-2">
        <button type="button" onClick={leave} className="btn w-full">
          Wyjdź z pokoju
        </button>
      </section>
    </main>
  );
}
