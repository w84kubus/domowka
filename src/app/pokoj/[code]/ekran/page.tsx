"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoomCodeNeon } from "@/components/RoomCodeNeon";
import { RoomQr } from "@/components/RoomQr";
import { useAnonAuth } from "@/hooks/useAnonAuth";
import { useServerClock } from "@/hooks/useServerClock";
import { useRoom } from "@/hooks/useRoom";
import { useWakeLock } from "@/hooks/useWakeLock";
import { apiPost } from "@/lib/client/api";
import { normalizeRoomCode } from "@/lib/room-code";
import { DISCONNECT_AFTER_MS } from "@/lib/types/room";
import { GAME_MANIFESTS } from "@/games/manifests";
import { GAME_COMPONENTS } from "@/games/components";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Ekran hosta (SPEC §3.9, UPGRADE.md §D7): wspólny ekran na TV/laptop.
// Duża typografia czytelna z 3 metrów, osobny layout — nie skalowany telefon.
// CRT efekt (scanlines + poświata) — to jest ekran, na który patrzy cały pokój.
export default function EkranPage() {
  const params = useParams<{ code: string }>();
  const code = normalizeRoomCode(params.code ?? "");
  const { uid, loading: authLoading } = useAnonAuth();
  const { serverNow } = useServerClock();
  useWakeLock(true); // ekran hosta (TV) nie gaśnie

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
      <main className="crt flex min-h-[100dvh] flex-col items-center justify-center">
        <div className="crt-scanlines" aria-hidden />
        <p className="font-display text-4xl font-bold uppercase text-ink-muted">
          Nie ma takiego pokoju.
        </p>
      </main>
    );
  }

  const now = serverNow();
  const players = room ? Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt) : [];

  // Gra w toku → ekran hosta pokazuje HostView danej gry (dramaturgia, SPEC §3.9).
  if (room && room.status !== "lobby" && room.gameId) {
    const manifest = GAME_MANIFESTS[room.gameId];
    const HostView = GAME_COMPONENTS[room.gameId]?.HostView;
    const accent = manifest?.accentColor ?? "#22d3ee";
    return (
      <ErrorBoundary context={`ekran:${room.gameId} room:${code}`}>
        <main className="crt flex min-h-[100dvh] flex-col items-center justify-center gap-8 p-8 text-center">
          <div className="crt-scanlines" aria-hidden />
          <div className="flex items-center gap-4">
            <span className="text-4xl">{manifest?.emoji}</span>
            <RoomCodeNeon code={code} size="3rem" accent={accent} />
          </div>
          {HostView && <HostView room={room} publicState={room.publicState} serverNow={serverNow} accent={accent} />}
        </main>
      </ErrorBoundary>
    );
  }

  // Lobby hosta — duży kod, QR, lista graczy czytelna z dystansu.
  return (
    <main className="crt flex min-h-[100dvh] flex-col items-center gap-12 p-8 pt-12 text-center">
      <div className="crt-scanlines" aria-hidden />

      {/* Header: wielki kod pokoju */}
      <header className="flex flex-col items-center gap-5">
        <span className="font-display text-2xl font-bold uppercase tracking-[0.4em] text-mint">
          Dołącz do pokoju
        </span>
        <RoomCodeNeon code={code} size="8rem" />
      </header>

      {/* QR — duży, czytelny ze skanem z dystansu */}
      <RoomQr code={code} size={280} />

      {/* Gracze — duże kafelki */}
      <section className="w-full max-w-4xl">
        <h2 className="font-display mb-6 text-2xl font-bold uppercase tracking-widest text-mint">
          Gracze ({players.length})
        </h2>
        <ul className="flex flex-wrap justify-center gap-6">
          {players.map((p) => {
            const connected = now - p.lastSeenAt < DISCONNECT_AFTER_MS;
            return (
              <li
                key={p.uid}
                className="flex flex-col items-center gap-3 rounded-[20px] border-[3px] border-stroke bg-panel px-8 py-6 shadow-[0_4px_0_rgb(0_0_0/0.35)] animate-[slideIn_0.3s_ease]"
                style={{ opacity: connected ? 1 : 0.35 }}
              >
                <span className="flex size-24 items-center justify-center rounded-full border-[6px] border-white bg-panel-hi text-6xl">
                  {p.avatar}
                </span>
                <span className="font-display text-xl font-bold text-ink">{p.nick}</span>
                {p.uid === room?.hostUid && (
                  <span className="font-display rounded-md bg-mint px-2 py-0.5 text-sm font-bold uppercase text-sheet-ink">
                    ★ host
                  </span>
                )}
                <span
                  className="inline-block size-3 rounded-full border-2 border-white/50"
                  style={{ background: connected ? "var(--color-online)" : "var(--color-offline)" }}
                  aria-label={connected ? "połączony" : "rozłączony"}
                />
              </li>
            );
          })}
        </ul>
        {players.length === 0 && (
          <p className="text-2xl font-semibold text-ink-muted">
            Zaproś znajomych i zaczynajcie.
          </p>
        )}
      </section>

      {/* URL do wpisania na telefonie */}
      <footer className="font-display text-xl font-bold uppercase tracking-[0.06em] text-ink-muted">
        domowka.vercel.app
      </footer>
    </main>
  );
}
