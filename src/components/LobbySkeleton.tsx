// D4 (UPGRADE.md §D4): skeleton ładowania lobby — kształt dopasowany do treści, nie spinner.
// Pokazywany zamiast „Wchodzę do pokoju…" gdy room jeszcze nie przyszedł z Firestore.
//
// WAŻNE: kształty muszą odpowiadać temu, co faktycznie przyjdzie. Poprzednia wersja
// obiecywała wyśrodkowany kod i blok QR 176 px na środku ekranu, a lobby ma tytuł
// z lewej i panel QR w prawym górnym rogu — po załadowaniu układ podskakiwał. Skeleton,
// który kłamie o układzie, jest gorszy od spinnera: spinner niczego nie obiecuje.
//
// Wymiary poniżej są ZMIERZONE na prawdziwym lobby przy 420 px szerokości:
// nagłówek 178 px (tytuł 92 + panel QR 144×178), wiersz gracza 86 px, wiersz gry 93 px.
// Wszystko w rem, więc skaluje się z bazowym stopniem pisma tak samo jak oryginał.

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-panel-hi ${className}`} />;
}

export function LobbySkeleton() {
  return (
    <main className="arcade-bg screen relative items-center gap-5 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />

      {/* Nagłówek: tytuł „POKÓJ XXXX" z lewej, panel QR z prawej */}
      <header className="relative flex w-full max-w-3xl items-start justify-between gap-4 sm:items-center sm:justify-center">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-none">
          <Bone className="h-11 w-44" />
          <Bone className="h-11 w-28 sm:hidden" />
        </div>
        <Bone className="h-44 w-36 flex-none rounded-[20px]" />
      </header>

      {/* Gracze: nagłówek sekcji + jeden wiersz */}
      <section className="relative flex w-full max-w-3xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <Bone className="h-5 w-28" />
          <Bone className="h-3 w-24" />
        </div>
        <Bone className="h-[5.375rem] w-full rounded-[14px]" />
      </section>

      {/* Gra: nagłówek sekcji + trzy wiersze wyboru */}
      <section className="relative flex w-full max-w-3xl flex-col gap-3">
        <Bone className="h-5 w-16" />
        <Bone className="h-24 w-full rounded-[14px]" />
        <Bone className="h-24 w-full rounded-[14px]" />
        <Bone className="h-24 w-full rounded-[14px]" />
      </section>
    </main>
  );
}
