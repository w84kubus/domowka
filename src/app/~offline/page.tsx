"use client";
// Ekran offline (UPGRADE.md §B2): jasny komunikat, nie dinozaur.
// Wyświetlany przez SW, gdy nawigacja nie pójdzie przez sieć.
export default function OfflinePage() {
  return (
    <main className="screen items-center justify-center gap-8 text-center">
      <div className="text-6xl" role="img" aria-label="Brak sieci">
        📡
      </div>
      <div className="flex flex-col gap-2">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Brak połączenia
        </h1>
        <p className="max-w-xs text-[var(--color-tekst-drugi)]">
          Domówka potrzebuje internetu, żeby zsynchronizować graczy. Sprawdź
          Wi-Fi i spróbuj ponownie.
        </p>
      </div>
      <button
        type="button"
        className="btn btn-accent"
        onClick={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
      >
        Spróbuj ponownie
      </button>
    </main>
  );
}
