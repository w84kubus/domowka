// Ekran startowy (SPEC §4): dwa przyciski, zero marketingu.
// Na tym etapie (Faza 0) to hello-world — przyciski jeszcze nie prowadzą do gry,
// służą też weryfikacji, że polskie znaki renderują się w każdym foncie.

export default function Home() {
  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-10 px-6 py-12"
      style={{
        paddingTop: "max(3rem, env(safe-area-inset-top))",
        paddingBottom: "max(3rem, env(safe-area-inset-bottom))",
      }}
    >
      <header className="flex flex-col items-center gap-3 text-center">
        <h1
          className="text-6xl font-bold tracking-wide text-[var(--color-tekst)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          DOMÓWKA
        </h1>
        <p className="max-w-xs text-[var(--color-tekst-drugi)]">
          Imprezowe gry na jeden wieczór. Każdy na swoim telefonie.
        </p>
      </header>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <button
          type="button"
          className="min-h-[56px] rounded-2xl border border-[var(--color-obramowanie)] bg-[var(--color-uniesione)] px-6 text-lg font-semibold text-[var(--color-tekst)] transition-colors active:bg-[var(--color-powierzchnia)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Zakładam pokój
        </button>
        <button
          type="button"
          className="min-h-[56px] rounded-2xl border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] px-6 text-lg font-semibold text-[var(--color-tekst)] transition-colors active:bg-[var(--color-uniesione)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dołączam
        </button>
      </div>

      {/* Test polskich znaków (latin-ext) — do usunięcia po Fazie 0. */}
      <section className="flex flex-col items-center gap-2 text-center text-sm text-[var(--color-tekst-drugi)]">
        <p style={{ fontFamily: "var(--font-display)" }}>
          Display: Zażółć gęślą jaźń — ĄĆĘŁŃÓŚŹŻ
        </p>
        <p style={{ fontFamily: "var(--font-body)" }}>
          Body: Zażółć gęślą jaźń — ĄĆĘŁŃÓŚŹŻ
        </p>
        <p className="tabular">Mono: 0123456789 — Łódź 7,43 s ĄĆĘŁŃÓŚŹŻ</p>
      </section>
    </main>
  );
}
