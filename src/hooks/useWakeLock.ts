"use client";
import { useEffect, useState } from "react";

// Wake Lock (SPEC §6.5, DoD §10): ekran nie może gasnąć w trakcie gry.
// iOS Safari < 16.4 nie wspiera → zwracamy supported=false, UI pokazuje fallback.
export function useWakeLock(active: boolean) {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      setSupported(false);
      return;
    }
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await (navigator as Navigator & { wakeLock: WakeLock }).wakeLock.request("screen");
      } catch {
        /* np. bateria w trybie oszczędzania — trudno */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && active && !cancelled) acquire();
    };

    if (active) {
      acquire();
      document.addEventListener("visibilitychange", onVisible);
    }
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);

  return { supported };
}
