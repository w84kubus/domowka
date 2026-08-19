"use client";
import { useEffect, useState } from "react";
import { DISCONNECT_AFTER_MS, type PlayerMap } from "@/lib/types/room";

// Lista graczy na żywo. Status „połączony" liczymy LOKALNIE z lastSeenAt vs czas serwera
// (SPEC §3.7) — rozłączony robi się szary, ale zostaje w grze. Lokalny ticker odświeża
// wyszarzenie nawet gdy rozłączony gracz przestał przysyłać snapshoty.
export function PlayerList({
  players,
  hostUid,
  myUid,
  serverNow,
  onKick,
}: {
  players: PlayerMap;
  hostUid: string;
  myUid: string | null;
  serverNow: () => number;
  onKick?: (uid: string) => void;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const now = serverNow();
  const sorted = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((p) => {
        const connected = now - p.lastSeenAt < DISCONNECT_AFTER_MS;
        const isMe = p.uid === myUid;
        const canKick = onKick && myUid === hostUid && !isMe;
        return (
          <li
            key={p.uid}
            className="flex items-center gap-3 rounded-[14px] border-[3px] border-stroke bg-panel px-3 py-2 shadow-[0_3px_0_rgb(0_0_0/0.35)] animate-[slideIn_0.3s_ease]"
            style={{ opacity: connected ? 1 : 0.45 }}
          >
            <span
              className="flex size-11 flex-none items-center justify-center rounded-full border-[3px] border-white bg-panel-hi text-2xl"
              aria-hidden
            >
              {p.avatar}
            </span>
            <span className="flex-1 truncate text-base font-bold text-ink">
              {p.nick}
              {isMe && <span className="font-semibold text-ink-muted"> (Ty)</span>}
            </span>
            {p.uid === hostUid && (
              <span
                className="font-display rounded-md bg-mint px-2 py-0.5 text-xs font-bold uppercase text-sheet-ink"
                title="Host"
              >
                ★ host
              </span>
            )}
            <span
              className="inline-block size-3 flex-none rounded-full border-2 border-white/50"
              style={{ background: connected ? "var(--color-online)" : "var(--color-offline)" }}
              aria-label={connected ? "połączony" : "rozłączony"}
              title={connected ? "połączony" : "rozłączony"}
            />
            {canKick && (
              <button
                type="button"
                onClick={() => onKick!(p.uid)}
                aria-label={`Wyrzuć ${p.nick}`}
                className="flex size-9 flex-none items-center justify-center rounded-lg text-base font-bold text-ink-muted transition-colors hover:bg-czerwien hover:text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint"
              >
                ✕
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
