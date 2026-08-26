"use client";
import { useT } from "@/lib/i18n/provider";

// Polska klawiatura ekranowa (SPEC §5.4) — własna, nie systemowa. 6 kolumn na telefon.
const BASE = "A Ą B C Ć D E Ę F G H I J K L Ł M N Ń O Ó P R S Ś T U W Y Z Ź Ż".split(" ");
const EXTRA = ["Q", "V", "X"];

export function PolishKeyboard({
  hits, misses, onLetter, disabled, extraLetters, pending,
}: {
  hits: string[];
  misses: string[];
  onLetter: (l: string) => void;
  disabled: boolean;
  extraLetters: boolean;
  pending?: Set<string>;
}) {
  const t = useT();
  const letters = extraLetters ? [...BASE, ...EXTRA] : BASE;
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {letters.map((l) => {
        const hit = hits.includes(l);
        const miss = misses.includes(l);
        const isPending = pending?.has(l) && !hit && !miss; // wciśnięte, czekamy na serwer
        const used = hit || miss || !!isPending;
        return (
          <button
            key={l}
            type="button"
            disabled={disabled || used}
            onClick={() => onLetter(l)}
            aria-label={t("wisielec.letter", { letter: l })}
            className="font-display flex h-11 items-center justify-center rounded-[10px] border-[3px] text-lg font-bold transition-transform duration-75 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint active:translate-y-[3px] active:shadow-none disabled:active:translate-y-0"
            style={{
              borderColor: hit ? "var(--color-mint)" : miss ? "var(--color-czerwien)" : isPending ? "var(--color-bursztyn)" : "var(--color-stroke)",
              background: hit ? "rgba(124,240,174,0.22)" : miss ? "rgba(228,0,43,0.22)" : isPending ? "var(--color-panel-hi)" : "var(--color-panel)",
              color: used ? "var(--color-ink-muted)" : "var(--color-ink)",
              boxShadow: used ? "none" : "0 3px 0 rgb(0 0 0 / 0.35)",
              opacity: (disabled && !used) || isPending ? 0.6 : 1,
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

type MaskCell = { ch: string | null; kind: "letter" | "space" | "punct" };

export function MaskedWord({ mask, accent, big }: { mask: MaskCell[]; accent: string; big?: boolean }) {
  // Grupujemy po spacjach — wyraźne przerwy między wyrazami (SPEC §5.4).
  const groups: MaskCell[][] = [[]];
  for (const cell of mask) {
    if (cell.kind === "space") groups.push([]);
    else groups[groups.length - 1].push(cell);
  }
  return (
    <div className={`flex flex-wrap items-end justify-center ${big ? "gap-x-3 gap-y-3" : "gap-x-2 gap-y-2"}`}>
      {groups.map((g, gi) => (
        <div key={gi} className={`flex ${big ? "gap-1.5" : "gap-1"}`}>
          {g.map((cell, i) => (
            <span
              key={i}
              className={`font-display inline-flex items-center justify-center border-b-[4px] text-center ${big ? "h-12 w-8 text-3xl" : "h-9 w-6 text-xl"} font-bold`}
              style={{
                borderColor: cell.kind === "punct" ? "transparent" : accent,
                color: cell.ch ? "var(--color-ink)" : "transparent",
              }}
            >
              {cell.kind === "punct" ? cell.ch : (cell.ch ?? " ")}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// Animowane SVG szubienicy (SPEC §5.4): 10 elementów rysowanych kreska po kresce.
// Ułamek pokazanych elementów = wrong / maxWrong (działa dla 6/8/10 żyć).
const PARTS = 10;
export function Hangman({ wrong, maxWrong, size = 180 }: { wrong: number; maxWrong: number; size?: number }) {
  // 1 utracone życie = 1 element (a nie ułamek); przy mniejszej liczbie żyć ludzik bywa niepełny.
  const shown = Math.min(PARTS, wrong);
  const on = (i: number) => (i < shown ? 1 : 0);
  const stroke = { stroke: "var(--color-ink)", strokeWidth: 4, fill: "none", strokeLinecap: "round" as const };
  const T = "opacity 0.4s ease";
  return (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} aria-label={`Szubienica: ${wrong}/${maxWrong}`}>
      {/* 0 podstawa, 1 słup, 2 belka, 3 lina */}
      <line x1="20" y1="210" x2="120" y2="210" style={{ ...stroke, opacity: on(0), transition: T }} />
      <line x1="50" y1="210" x2="50" y2="20" style={{ ...stroke, opacity: on(1), transition: T }} />
      <line x1="50" y1="20" x2="140" y2="20" style={{ ...stroke, opacity: on(2), transition: T }} />
      <line x1="140" y1="20" x2="140" y2="45" style={{ ...stroke, opacity: on(3), transition: T }} />
      {/* 4 głowa */}
      <circle cx="140" cy="60" r="15" style={{ ...stroke, opacity: on(4), transition: T }} />
      {/* 5 tułów */}
      <line x1="140" y1="75" x2="140" y2="130" style={{ ...stroke, opacity: on(5), transition: T }} />
      {/* 6,7 ręce */}
      <line x1="140" y1="90" x2="120" y2="115" style={{ ...stroke, opacity: on(6), transition: T }} />
      <line x1="140" y1="90" x2="160" y2="115" style={{ ...stroke, opacity: on(7), transition: T }} />
      {/* 8,9 nogi */}
      <line x1="140" y1="130" x2="122" y2="160" style={{ ...stroke, opacity: on(8), transition: T }} />
      <line x1="140" y1="130" x2="158" y2="160" style={{ ...stroke, opacity: on(9), transition: T }} />
    </svg>
  );
}
