// Ekran startowy (SPEC §4): dwa przyciski, zero marketingu, zero landing page'a.
// C1: propozycja powrotu do aktywnego pokoju.
import Link from "next/link";
import { ReturnToRoom } from "@/components/ReturnToRoom";

export default function Home() {
  return (
    <main className="screen items-center justify-center gap-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1
          className="text-6xl font-bold tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          DOMÓWKA
        </h1>
        <p className="max-w-xs text-[var(--color-tekst-drugi)]">
          Imprezowe gry na jeden wieczór. Każdy na swoim telefonie.
        </p>
      </header>

      <ReturnToRoom />

      <div className="flex w-full max-w-xs flex-col gap-4">
        <Link href="/nowy" className="btn btn-accent">
          Zakładam pokój
        </Link>
        <Link href="/dolacz" className="btn">
          Dołączam
        </Link>
      </div>
    </main>
  );
}
