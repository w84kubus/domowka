"use client";
import Link from "next/link";
import Image from "next/image";
import { ReturnToRoom } from "@/components/ReturnToRoom";
import { GameCard } from "@/components/GameCard";
import { HowToPlay } from "@/components/HowToPlay";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GAME_LIST } from "@/games/manifests";
import { useT } from "@/lib/i18n/provider";

// Treść landingu wyjęta z page.tsx do komponentu klienckiego: przełącznik języka
// musi natychmiast przerenderować teksty, a page.tsx zostaje serwerowy, bo trzyma
// logikę deep linku (/?kod= → redirect), która musi wykonać się przed renderem.
export function LandingContent() {
  const t = useT();
  return (
    <main className="arcade-bg screen relative items-center gap-10 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative flex w-full max-w-4xl justify-end">
        <LanguageSwitcher />
      </div>

      <header className="relative flex w-full flex-col items-center gap-4 text-center">
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
          {t("landing.tagline")}
        </p>
        <div className="flex w-full max-w-md gap-3 pt-2">
          <Link href="/nowy" className="btn min-w-0 flex-1 px-3 text-base sm:whitespace-nowrap">
            {t("landing.create")}
          </Link>
          <Link href="/dolacz" className="btn btn-ghost min-w-0 flex-1 px-3 text-base sm:whitespace-nowrap">
            {t("landing.join")}
          </Link>
        </div>
      </header>

      <ReturnToRoom />

      <section className="relative flex w-full max-w-4xl flex-col gap-4">
        <h2 className="font-display text-center text-2xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_3px_0_rgb(0_0_0/0.35)]">
          {t("landing.games")}
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
