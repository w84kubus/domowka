"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { Room } from "@/lib/types/room";

interface RoomState {
  room: Room | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

/**
 * Realtime subskrypcja dokumentu pokoju (SPEC §3.1: klient tylko CZYTA).
 * Wymaga wcześniejszego uwierzytelnienia (reguły §3.3 wpuszczają tylko graczy/obserwatorów).
 *
 * ODPORNOŚĆ: tuż po dołączeniu token gracza bywa jeszcze nie w pełni rozpropagowany do
 * Firestore SDK → pierwszy odczyt może dostać przejściowy permission-denied. Zamiast wisieć
 * na „Wchodzę do pokoju…" bez końca, ponawiamy subskrypcję z narastającym opóźnieniem.
 */
export function useRoom(code: string | null, authReady: boolean): RoomState {
  const [state, setState] = useState<RoomState>({
    room: null,
    loading: true,
    error: null,
    notFound: false,
  });

  useEffect(() => {
    if (!code || !authReady) return;
    let cancelled = false;
    let unsub: () => void = () => {};
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    const MAX_RETRIES = 6;

    const subscribe = () => {
      const ref = doc(getDb(), "rooms", code);
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (cancelled) return;
          retries = 0; // udany odczyt zeruje licznik
          if (!snap.exists()) {
            setState({ room: null, loading: false, error: null, notFound: true });
            return;
          }
          setState({ room: snap.data() as Room, loading: false, error: null, notFound: false });
        },
        (err) => {
          if (cancelled) return;
          unsub(); // martwy listener — trzeba założyć nowy
          if (retries < MAX_RETRIES) {
            retries++;
            // C4: wykładniczy backoff — 0,5s, 1s, 2s, 4s, 8s, 16s
            retryTimer = setTimeout(subscribe, Math.min(500 * Math.pow(2, retries - 1), 16_000));
          } else {
            setState({ room: null, loading: false, error: err.message, notFound: false });
          }
        },
      );
    };
    subscribe();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsub();
    };
  }, [code, authReady]);

  return state;
}
