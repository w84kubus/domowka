"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

// Subskrypcja rooms/{code}/private/{uid} — tajemnice tylko dla mnie (SPEC §3.1).
// Reguły (§3.3) wpuszczają wyłącznie właściciela uid.
//
// Listener MUSI się odbudowywać po błędzie. Wcześniej błąd tylko zerował payload i na tym
// koniec — martwy listener nie dostawał już nic, więc gracz w Mafii/Impostorze tracił swoją
// rolę do końca partii. Przejściowy permission-denied zdarza się realnie tuż po starcie gry,
// czyli dokładnie wtedy, gdy private doc powstaje po raz pierwszy.
export function usePrivate(code: string | null, uid: string | null, authReady: boolean): unknown {
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    if (!code || !uid || !authReady) return;
    let cancelled = false;
    let unsub: () => void = () => {};
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    const MAX_RETRIES = 8;

    const subscribe = () => {
      const ref = doc(getDb(), "rooms", code, "private", uid);
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (cancelled) return;
          retries = 0;
          setPayload(snap.exists() ? (snap.data() as { payload: unknown }).payload : null);
        },
        () => {
          if (cancelled) return;
          unsub();
          if (retries >= MAX_RETRIES) return; // zostaw ostatnią znaną rolę, nie kasuj jej
          retries++;
          retryTimer = setTimeout(subscribe, Math.min(300 * Math.pow(2, retries - 1), 2_000));
        },
      );
    };
    subscribe();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsub();
    };
  }, [code, uid, authReady]);

  return payload;
}
