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
      <main className="arcade-bg screen relative items-center justify-center gap-6 overflow-hidden text-center">
        <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
        <p className="font-display relative text-2xl font-bold uppercase text-ink">
          Nie ma takiego pokoju
        </p>
        <RoomCodeNeon code={code} accent="var(--color-czerwien)" />
        <Link href="/dolacz" className="btn relative">
          Spróbuj innego kodu
        </Link>
      </main>
    );
  }

  // Subskrypcja ostatecznie padła (po ponowieniach) — pokaż odzysk zamiast wisieć w nieskończoność.
  if (error && !wasMemberRef.current) {
    return (
      <main className="arcade-bg screen relative items-center justify-center gap-5 overflow-hidden text-center">
        <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
        <p className="font-display relative text-2xl font-bold uppercase text-ink">
          Nie udało się wejść
        </p>
        <p className="relative max-w-xs text-base font-semibold text-ink-muted">
          Sprawdź połączenie i spróbuj ponownie.
        </p>
        <button type="button" className="btn relative" onClick={() => window.location.reload()}>
          Spróbuj ponownie
        </button>
        <Link
          href="/dolacz"
          className="font-display relative text-sm font-bold uppercase tracking-[0.06em] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
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
    <main className="arcade-bg screen relative gap-5 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />

      {/* Nagłówek: wielki tytuł „POKÓJ XXXX" + QR w rogu (mockup) */}
      <header className="relative flex items-start justify-between gap-3">
        <h1 className="font-display text-outline min-w-0 flex-1 text-[2.75rem] font-bold uppercase leading-[1.05] tracking-wide text-ink">
          Pokój{" "}
          <span className="text-limonka">{room.code}</span>
        </h1>
        <div className="flex flex-none flex-col items-center gap-1 rounded-[20px] border-[3px] border-stroke bg-panel p-2 shadow-[0_4px_0_rgb(0_0_0/0.35)]">
          <RoomQr code={room.code} size={92} />
          <ShareButton code={room.code} compact />
        </div>
      </header>

      {/* Pasek gracza */}
      <section className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.06em] text-mint">
            Gracze ({playerCount})
          </h2>
          <Link
            href={`/pokoj/${room.code}/ekran`}
            target="_blank"
            className="font-display text-xs font-bold uppercase tracking-[0.06em] text-mint underline-offset-4 hover:underline"
          >
            Ekran na TV ↗
          </Link>
        </div>
        {playerCount === 0 ? (
          <p className="card text-center text-base font-semibold text-ink-muted">
            Zaproś znajomych i zaczynajcie.
          </p>
        ) : (
          <PlayerList
            players={room.players}
            hostUid={room.hostUid}
            myUid={uid}
            serverNow={serverNow}
            onKick={isHost ? kick : undefined}
          />
        )}
      </section>

      <section className="relative flex flex-col gap-3">
        <LobbyGames code={room.code} isHost={isHost} playerCount={playerCount} />
      </section>

      <section className="relative mt-auto pt-2">
        <button type="button" onClick={leave} className="btn btn-ghost w-full">
          Wyjdź z pokoju
        </button>
      </section>
    </main>
  );
}
