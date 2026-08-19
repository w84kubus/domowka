"use client";
import { WifiOff } from "lucide-react";
// Ekran offline (UPGRADE.md §B2): jasny komunikat, nie dinozaur.
// Wyświetlany przez SW, gdy nawigacja nie pójdzie przez sieć.
export default function OfflinePage() {
  return (
    <main className="arcade-bg screen relative items-center justify-center gap-6 overflow-hidden text-center">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex justify-center text-mint" role="img" aria-label="Brak sieci">
        <WifiOff size={64} strokeWidth={2.5} aria-hidden />
      </div>
      <div className="relative flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-ink">
          Brak połączenia
        </h1>
        <p className="max-w-xs text-base font-semibold leading-relaxed text-ink-muted">
          Domówka potrzebuje internetu, żeby zsynchronizować graczy. Sprawdź
          Wi-Fi i spróbuj ponownie.
        </p>
      </div>
      <button
        type="button"
        className="btn relative"
        onClick={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
      >
        Spróbuj ponownie
      </button>
    </main>
  );
}
