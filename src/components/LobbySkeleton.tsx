// D4 (UPGRADE.md §D4): skeleton ładowania lobby — kształt dopasowany do treści, nie spinner.
// Pokazywany zamiast „Wchodzę do pokoju…" gdy room jeszcze nie przyszedł z Firestore.

function Bone({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--color-powierzchnia)] ${className}`}
    />
  );
}

export function LobbySkeleton() {
  return (
    <main className="screen gap-8">
      {/* Header: "Pokój" + kod */}
      <header className="flex flex-col items-center gap-3 pt-2">
        <Bone className="h-4 w-16" />
        <div className="flex gap-2">
          <Bone className="h-12 w-10 rounded-xl" />
          <Bone className="h-12 w-10 rounded-xl" />
          <Bone className="h-12 w-10 rounded-xl" />
          <Bone className="h-12 w-10 rounded-xl" />
        </div>
      </header>

      {/* QR section */}
      <section className="flex flex-col items-center gap-3">
        <Bone className="h-40 w-40 rounded-2xl" />
        <Bone className="h-4 w-48" />
      </section>

      {/* Gracze */}
      <section className="flex flex-col gap-3">
        <Bone className="h-4 w-24" />
        <Bone className="h-16 w-full rounded-xl" />
        <Bone className="h-16 w-full rounded-xl" />
        <Bone className="h-16 w-full rounded-xl" />
      </section>
    </main>
  );
}
