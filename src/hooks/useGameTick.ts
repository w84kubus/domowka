"use client";
import { useEffect, useRef } from "react";
import { apiPost } from "@/lib/client/api";

// Fazy czasowe bez crona (SPEC §3.5): gdy klient lokalnie zauważy, że phaseEndsAt minął,
// PONAGLA serwer /tickiem — i robi to dalej co ~1,2 s, DOPÓKI faza faktycznie nie przejdzie.
// Kluczowe: żadnego „raz i koniec". Przy rozjeździe zegarów pierwszy tick może dostać 204
// („jeszcze nie czas") — wtedy trzeba spróbować ponownie, inaczej faza wisi. Serwer weryfikuje
// swoim zegarem, a transakcja daje idempotencję, więc powtarzanie jest bezpieczne.
export function useGameTick(
  code: string | null,
  phaseEndsAt: number | null,
  playing: boolean,
  serverNow: () => number,
) {
  const lastTick = useRef(0);

  useEffect(() => {
    if (!code || !playing) return;

    const tick = () => {
      lastTick.current = Date.now();
      apiPost(`/api/rooms/${code}/tick`).catch(() => {});
    };

    const id = setInterval(() => {
      if (phaseEndsAt == null) return;
      // Faza przeterminowana wg naszego (skorygowanego) zegara → ponaglaj, aż serwer przejdzie dalej.
      if (serverNow() >= phaseEndsAt && Date.now() - lastTick.current > 1000 + Math.random() * 500) {
        tick();
      }
    }, 400);

    return () => clearInterval(id);
  }, [code, phaseEndsAt, playing, serverNow]);
}
