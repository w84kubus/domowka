"use client";
import { useEffect, useRef, useState } from "react";
import { GAME_COMPONENTS } from "@/games/components";
import { GAMES } from "@/games/registry";
import { usePrivate } from "@/hooks/usePrivate";
import { useGameTick } from "@/hooks/useGameTick";
import { useWakeLock } from "@/hooks/useWakeLock";
import { apiPost } from "@/lib/client/api";
import { isMuted, setMuted, unlockAudio, sfx } from "@/lib/sound";
import { celebrate } from "@/lib/confetti";
import { RoomCodeNeon } from "@/components/RoomCodeNeon";
import type { Room } from "@/lib/types/room";

// Harness kliencki gry: podpina private/{uid}, tick fazy, dispatch akcji i renderuje PlayerView.
// Rdzeń nie zna konkretnej gry — bierze komponent z GAME_COMPONENTS wg room.gameId.
export function GameShell({
  room,
  meUid,
  serverNow,
}: {
  room: Room;
  meUid: string;
  serverNow: () => number;
}) {
  const gameId = room.gameId!;
  const entry = GAMES[gameId];
  const comps = GAME_COMPONENTS[gameId];
  const isHost = room.hostUid === meUid;
  const accent = entry?.manifest.accentColor ?? "#f5f3ff";

  const privateState = usePrivate(room.code, meUid, true);
  const { supported: wakeSupported } = useWakeLock(true); // ekran nie gaśnie w grze
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    unlockAudio();
    setMutedState(isMuted());
  }, []);

  // Konfetti + fanfara na koniec gry (SPEC §6.4).
  const celebrated = useRef(false);
  useEffect(() => {
    if (room.status === "finished" && !celebrated.current) {
      celebrated.current = true;
      celebrate([accent, "#F5F3FF", "#FFB627"]);
      sfx.fanfara();
    }
  }, [room.status, accent]);

  useGameTick(room.code, room.phaseEndsAt, isHost, room.status === "playing", serverNow);

  if (!entry || !comps) {
    return <p className="p-6 text-center text-[var(--color-tekst-drugi)]">Nieznana gra: {gameId}</p>;
  }
  const { PlayerView } = comps;

  const dispatch = (action: unknown): Promise<void> =>
    apiPost(`/api/rooms/${room.code}/action`, { action }).then(() => undefined);
  const finished = room.status === "finished";

  return (
    <main className="screen gap-6" style={{ ["--accent" as string]: accent }}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--color-tekst-drugi)]">
          <span>{entry.manifest.emoji}</span>
          <RoomCodeNeon code={room.code} size="1.1rem" accent={accent} />
        </div>
        <button
          type="button"
          aria-label={muted ? "Włącz dźwięk" : "Wycisz"}
          onClick={() => {
            const m = !muted;
            setMuted(m);
            setMutedState(m);
            if (!m) unlockAudio();
          }}
          className="rounded-lg border border-[var(--color-obramowanie)] px-3 py-1 text-sm"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </header>

      <div className="flex-1">
        <PlayerView
          room={room}
          publicState={room.publicState}
          privateState={privateState}
          meUid={meUid}
          isHost={isHost}
          serverNow={serverNow}
          dispatch={dispatch}
          accent={accent}
        />
      </div>

      {!wakeSupported && (
        <p className="text-center text-xs text-[var(--color-tekst-drugi)]">
          Ustaw wygaszanie ekranu na dłużej — Twoja przeglądarka nie utrzyma go sama.
        </p>
      )}

      {finished && isHost && (
        <button className="btn" onClick={() => apiPost(`/api/rooms/${room.code}/reset`).catch(() => {})}>
          Do lobby (jeszcze raz)
        </button>
      )}
    </main>
  );
}
