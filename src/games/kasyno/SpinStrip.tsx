"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface StripItem {
  key: string;
  node: ReactNode;
  bg?: string;
}

/**
 * Przewijany pasek, który wyhamowuje na wyniku. Wspólny dla Jackpota, Double i Wheel —
 * te trzy tryby różni tylko zawartość kafelków, więc animacja jest jedna.
 *
 * Wynik jest znany od początku (zakłady są już zamknięte, patrz komentarz w engine.ts),
 * więc pasek nie „losuje" — po prostu jedzie do zadanego kafelka.
 */
export function SpinStrip({
  items,
  targetIndex,
  spinning,
  itemWidth = 92,
  loops = 6,
  durationMs = 7000,
  elapsedMs = 0,
}: {
  items: StripItem[];
  targetIndex: number;
  spinning: boolean;
  itemWidth?: number;
  loops?: number;
  durationMs?: number;
  /**
   * Ile animacji już minęło wg zegara SERWERA. Bez tego każdy klient startował
   * własne 7 s od chwili, w której u niego zamontował się komponent — kto wszedł
   * z opóźnieniem, oglądał losowanie „w trakcie" albo urwane. Teraz wszyscy
   * kończą w tym samym momencie, a spóźniony ma po prostu krótszy przelot.
   */
  elapsedMs?: number;
}) {
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [pozostalo, setPozostalo] = useState(durationMs);
  const startedFor = useRef<string | null>(null);

  const n = items.length;
  // Pasek to kilka pełnych pętli plus dojazd do celu — dzięki temu widać długi przelot,
  // a nie samo przeskoczenie na wynik.
  const repeats = loops + 2;
  const strip = Array.from({ length: repeats * n }, (_, i) => items[i % n]);

  useEffect(() => {
    if (!spinning || n === 0) return;
    const id = `${targetIndex}:${n}`;
    if (startedFor.current === id) return;
    startedFor.current = id;

    const reduced =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const docelowy = (loops * n + targetIndex) * itemWidth;
    const zostalo = Math.max(0, durationMs - elapsedMs);
    // Animacja praktycznie po czasie albo wyłączony ruch → od razu wynik.
    if (reduced || zostalo < 350) {
      setAnimating(false);
      setOffset(docelowy);
      return;
    }
    setPozostalo(zostalo);
    // Reset bez animacji, potem start — inaczej przeglądarka skleiłaby to w jeden skok.
    setAnimating(false);
    setOffset(0);
    const t = setTimeout(() => {
      setAnimating(true);
      setOffset(docelowy);
    }, 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, targetIndex, n, itemWidth, loops, durationMs]);

  useEffect(() => {
    if (!spinning) startedFor.current = null;
  }, [spinning]);

  return (
    <div className="relative w-full overflow-hidden rounded-[20px] border-[3px] border-stroke bg-black/25 py-3">
      {/* Wskaźnik na środku — to on wyznacza wynik */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-[3px] -translate-x-1/2 bg-mint"
        aria-hidden
      />
      <div
        className="flex"
        style={{
          transform: `translateX(calc(50% - ${itemWidth / 2}px - ${offset}px))`,
          transition: animating ? `transform ${pozostalo}ms cubic-bezier(0.12, 0.72, 0.12, 1)` : "none",
        }}
      >
        {strip.map((it, i) => (
          <div
            key={`${it.key}-${i}`}
            className="flex flex-none items-center justify-center rounded-[12px] border-2 border-white/20"
            style={{ width: itemWidth - 8, height: itemWidth - 8, marginInline: 4, background: it.bg }}
          >
            {it.node}
          </div>
        ))}
      </div>
    </div>
  );
}
