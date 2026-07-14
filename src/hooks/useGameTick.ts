"use client";
import { useEffect, useRef } from "react";
import { apiPost } from "@/lib/client/api";

// Fazy czasowe bez crona (SPEC §3.5): gdy klient lokalnie zauważy, że phaseEndsAt minął,
// po losowym opóźnieniu 200–800 ms strzela /tick. Host dodatkowo tika co 3 s jako bezpiecznik.
// Serwer i tak weryfikuje swoim zegarem, a transakcja daje idempotencję.
export function useGameTick(
  code: string | null,
  phaseEndsAt: number | null,
  isHost: boolean,
  playing: boolean,
  serverNow: () => number,
) {
  const firedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!code || !playing) return;

    const tick = () => apiPost(`/api/rooms/${code}/tick`).catch(() => {});

    // Sprawdzaj lokalnie co 250 ms, czy faza wygasła.
    const check = setInterval(() => {
      if (phaseEndsAt != null && serverNow() >= phaseEndsAt && firedFor.current !== phaseEndsAt) {
        firedFor.current = phaseEndsAt;
        setTimeout(tick, 200 + Math.random() * 600);
      }
    }, 250);

    // Host: bezpiecznik co 3 s.
    const safety = isHost ? setInterval(tick, 3000) : null;

    return () => {
      clearInterval(check);
      if (safety) clearInterval(safety);
    };
  }, [code, phaseEndsAt, isHost, playing, serverNow]);
}
