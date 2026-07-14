"use client";
import { useEffect } from "react";
import { apiPost } from "@/lib/client/api";
import { PING_INTERVAL_MS } from "@/lib/types/room";

/**
 * Utrzymuje obecność gracza w pokoju: ping co 5 s → serwer aktualizuje lastSeenAt (SPEC §3.7).
 * Ping od razu przy wejściu, potem w interwale. Przy schowaniu karty przeglądarka i tak
 * uśpi interwał — po powrocie lastSeenAt się odświeży, a rozłączenie i tak nie wyrzuca z gry.
 */
export function usePresence(code: string | null, enabled: boolean) {
  useEffect(() => {
    if (!code || !enabled) return;
    let active = true;

    const ping = () => {
      apiPost(`/api/rooms/${code}/ping`).catch(() => {
        /* przejściowy błąd sieci — następny ping spróbuje ponownie */
      });
    };

    ping();
    const id = setInterval(() => {
      if (active) ping();
    }, PING_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [code, enabled]);
}
