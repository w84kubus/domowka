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
            className="card flex items-center gap-3 px-4 py-3"
            style={{ opacity: connected ? 1 : 0.45 }}
          >
            <span className="text-2xl" aria-hidden>
              {p.avatar}
            </span>
            <span className="flex-1 truncate font-semibold">
              {p.nick}
              {isMe && <span className="text-[var(--color-tekst-drugi)]"> (Ty)</span>}
            </span>
            {p.uid === hostUid && (
              <span
                className="rounded-md bg-[var(--color-uniesione)] px-2 py-0.5 text-xs text-[var(--color-bursztyn)]"
                title="Host"
              >
                ★ host
              </span>
            )}
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: connected ? "#4ade80" : "#6b7280" }}
              aria-label={connected ? "połączony" : "rozłączony"}
              title={connected ? "połączony" : "rozłączony"}
            />
            {canKick && (
              <button
                type="button"
                onClick={() => onKick!(p.uid)}
                aria-label={`Wyrzuć ${p.nick}`}
                className="rounded-md px-2 py-1 text-sm text-[var(--color-tekst-drugi)] hover:text-[var(--color-czerwien)]"
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
