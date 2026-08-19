// D4 (UPGRADE.md §D4): skeleton ładowania lobby — kształt dopasowany do treści, nie spinner.
// Pokazywany zamiast „Wchodzę do pokoju…" gdy room jeszcze nie przyszedł z Firestore.

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-panel-hi ${className}`} />;
}

export function LobbySkeleton() {
  return (
    <main className="arcade-bg screen relative gap-6 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />

      {/* Header: "Pokój" + kod */}
      <header className="relative flex flex-col items-center gap-3">
        <Bone className="h-3 w-16" />
        <div className="flex gap-2">
          <Bone className="h-14 w-12 rounded-[14px]" />
          <Bone className="h-14 w-12 rounded-[14px]" />
          <Bone className="h-14 w-12 rounded-[14px]" />
          <Bone className="h-14 w-12 rounded-[14px]" />
        </div>
      </header>

      {/* QR section */}
      <section className="card relative flex flex-col items-center gap-4">
        <Bone className="h-44 w-44 rounded-[14px]" />
        <Bone className="h-4 w-48" />
        <Bone className="h-14 w-full rounded-[14px]" />
      </section>

      {/* Gracze */}
      <section className="relative flex flex-col gap-3">
        <Bone className="h-6 w-32" />
        <Bone className="h-16 w-full rounded-[14px]" />
        <Bone className="h-16 w-full rounded-[14px]" />
      </section>
    </main>
  );
}
