"use client";
import { GameIcon } from "@/components/GameIcon";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { GAME_COMPONENTS } from "@/games/components";
import { GAME_MANIFESTS } from "@/games/manifests";
import { usePrivate } from "@/hooks/usePrivate";
import { useGameTick } from "@/hooks/useGameTick";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { apiPost } from "@/lib/client/api";
import { newActionId } from "@/lib/action-id";
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
  const manifest = GAME_MANIFESTS[gameId];
  const comps = GAME_COMPONENTS[gameId];
  const isHost = room.hostUid === meUid;
  const accent = manifest?.accentColor ?? "#f5f3ff";

  const privateState = usePrivate(room.code, meUid, true);
  const { supported: wakeSupported } = useWakeLock(true); // ekran nie gaśnie w grze
  useVisualViewport(); // --vvh, --vv-offset dla klawiatury na mobile
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

  useGameTick(room.code, room.phaseEndsAt, room.status === "playing", serverNow);

  if (!manifest || !comps) {
    return <p className="p-6 text-center font-semibold text-ink-muted">Nieznana gra: {gameId}</p>;
  }
  const { PlayerView } = comps;

  // C2: actionId generowany raz per kliknięcie — serwer odrzuca duplikaty.
  const dispatch = (action: unknown): Promise<void> =>
    apiPost(`/api/rooms/${room.code}/action`, { action, actionId: newActionId() }).then(() => undefined);
  const finished = room.status === "finished";

  return (
    <main
      className="arcade-bg screen relative gap-5 overflow-hidden"
      style={{ ["--accent" as string]: accent }}
    >
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <GameIcon gameId={gameId} size={26} color={accent} />
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
          className="flex size-11 flex-none items-center justify-center rounded-[14px] border-[3px] border-stroke bg-panel text-lg shadow-[0_3px_0_rgb(0_0_0/0.35)] transition-transform duration-75 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint active:translate-y-[3px] active:shadow-none"
        >
          {muted ? <VolumeX size={20} strokeWidth={2.5} aria-hidden /> : <Volume2 size={20} strokeWidth={2.5} aria-hidden />}
        </button>
      </header>

      <div className="relative flex-1">
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
        <p className="relative text-center text-xs font-semibold text-ink-muted">
          Ustaw wygaszanie ekranu na dłużej — Twoja przeglądarka nie utrzyma go sama.
        </p>
      )}

      {finished && isHost && (
        <button
          className="btn relative"
          onClick={() => apiPost(`/api/rooms/${room.code}/reset`).catch(() => {})}
        >
          Jeszcze raz
        </button>
      )}
    </main>
  );
}
