// Ekran startowy (SPEC §4) + landing (mockup: hero → sekcja gier → jak grać → stopka).
// G2: deep link /?kod=XYZW → redirect do /p/XYZW (UPGRADE.md §G).
// C1: propozycja powrotu do aktywnego pokoju.
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ReturnToRoom } from "@/components/ReturnToRoom";
import { GameCard } from "@/components/GameCard";
import { HowToPlay } from "@/components/HowToPlay";
// manifests.ts, nie registry.ts — registry ciągnie silniki gier (~1700 linii),
// a landing potrzebuje tylko metadanych.
import { GAME_LIST } from "@/games/manifests";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/room-code";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kod?: string }>;
}) {
  const { kod } = await searchParams;
  if (kod) {
    const code = normalizeRoomCode(kod);
    if (isValidRoomCode(code)) redirect(`/p/${code}`);
  }
  return (
    <main className="arcade-bg screen relative items-center gap-10 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />

      {/* Hero */}
      {/* w-full: w kolumnowym flexie z items-center dziecko rozpycha się do
          szerokości treści i wychodzi poza ekran na wąskich telefonach. */}
      <header className="relative flex w-full flex-col items-center gap-4 pt-4 text-center">
        {/* Logo — priority, bo to największy element nad zgięciem (LCP). */}
        <Image
          src="/icon-512.png"
          alt=""
          width={132}
          height={132}
          priority
          className="size-24 drop-shadow-[0_6px_0_rgb(0_0_0/0.28)] sm:size-32"
          aria-hidden
        />
        <h1 className="font-display text-5xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_4px_0_rgb(0_0_0/0.35)] sm:text-6xl">
          Domówka
        </h1>
        <p className="max-w-md text-lg font-semibold leading-relaxed text-ink-muted">
          Imprezowe gry na jeden wieczór. Każdy na swoim telefonie.
        </p>
        <div className="flex w-full max-w-md gap-3 pt-2">
          {/* min-w-0: bez tego flex-1 nie zejdzie poniżej szerokości najdłuższego
              słowa („ZAKŁADAM") i przyciski wystają poza ekran na 320–375 px. */}
          <Link href="/nowy" className="btn min-w-0 flex-1 px-3 text-base sm:whitespace-nowrap">
            Zakładam pokój
          </Link>
          <Link
            href="/dolacz"
            className="btn btn-ghost min-w-0 flex-1 px-3 text-base sm:whitespace-nowrap"
          >
            Dołączam
          </Link>
        </div>
      </header>

      <ReturnToRoom />

      {/* Sekcja gier */}
      <section className="relative flex w-full max-w-4xl flex-col gap-4">
        <h2 className="font-display text-center text-2xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_3px_0_rgb(0_0_0/0.35)]">
          Sekcja gier
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {GAME_LIST.map((g) => (
            <GameCard key={g.id} manifest={g} />
          ))}
        </ul>
      </section>

      <HowToPlay />

      <footer className="font-display relative mt-auto pt-4 text-center text-xs font-bold uppercase tracking-[0.06em] text-ink-muted opacity-70">
        domowka.vercel.app
      </footer>
    </main>
  );
}
