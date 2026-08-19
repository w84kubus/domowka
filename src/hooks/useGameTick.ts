"use client";
import { useEffect, useRef } from "react";
import { apiPost } from "@/lib/client/api";

// Odstęp między kolejnymi próbami tego samego klienta.
const RETRY_MS = 1200;
// Zapasowi (nie-host) czekają, zanim zaczną ponaglać — daje hostowi czas na zrobienie
// tego pierwszemu. Bez tego wszyscy strzelają naraz.
const FALLBACK_AFTER_MS = 3000;

/**
 * Fazy czasowe bez crona (SPEC §3.5): gdy klient zauważy, że phaseEndsAt minął,
 * PONAGLA serwer /tickiem i powtarza, dopóki faza nie przejdzie. Żadnego „raz i koniec" —
 * przy rozjeździe zegarów pierwszy tick może dostać 204, a faza nie może zawisnąć.
 *
 * WYDAJNOŚĆ: ponagla tylko HOST. Wcześniej robili to wszyscy naraz, co przy 8 graczach
 * dawało ~6,6 transakcji/s na dokumencie pokoju — wielokrotnie ponad limit Firestore
 * (~1 zapis/s na dokument). Transakcje wchodziły w konflikt i ponawiały się, więc realne
 * przejście fazy potrafiło spóźnić się o kilka sekund.
 *
 * Pozostali są ZAPASEM: ruszają dopiero, gdy faza jest przeterminowana o ponad 3 s —
 * czyli gdy host wypadł albo ma zerwaną sieć. Dzięki temu faza nie zawiśnie, a w normalnym
 * przebiegu ponagla dokładnie jeden klient.
 */
export function useGameTick(
  code: string | null,
  phaseEndsAt: number | null,
  playing: boolean,
  serverNow: () => number,
  isHost: boolean,
) {
  const lastTick = useRef(0);

  useEffect(() => {
    if (!code || !playing) return;

    const id = setInterval(() => {
      if (phaseEndsAt == null) return;
      const overdue = serverNow() - phaseEndsAt;
      if (overdue < 0) return;
      // Zapasowi wchodzą dopiero, gdy host wyraźnie nie daje rady.
      if (!isHost && overdue < FALLBACK_AFTER_MS) return;
      if (Date.now() - lastTick.current < RETRY_MS + Math.random() * 500) return;

      lastTick.current = Date.now();
      apiPost(`/api/rooms/${code}/tick`).catch(() => {});
    }, 400);

    return () => clearInterval(id);
  }, [code, phaseEndsAt, playing, serverNow, isHost]);
}
