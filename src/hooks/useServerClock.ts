"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Korekta zegara (SPEC §3.6): telefony mają zegary rozjechane o kilkadziesiąt sekund,
// więc czas do odliczeń bierzemy jako Date.now() + offset względem serwera.
async function measureOffset(): Promise<number> {
  const t0 = Date.now();
  const res = await fetch("/api/time", { cache: "no-store" });
  const { now } = (await res.json()) as { now: number };
  const t1 = Date.now();
  return now + (t1 - t0) / 2 - t1;
}

export function useServerClock() {
  const offsetRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      try {
        const offset = await measureOffset();
        if (active) {
          offsetRef.current = offset;
          setReady(true);
        }
      } catch {
        // brak sieci — trudno, zostaje ostatni znany offset (na starcie 0)
        if (active) setReady(true);
      }
    };
    sync();
    const id = setInterval(sync, 60_000); // odświeżaj offset co 60 s (SPEC §3.6)
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);
  return { serverNow, ready };
}
