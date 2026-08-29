"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Square, Trophy } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import { sfx, unlockAudio, vibrate } from "@/lib/sound";
import { celebrateGold } from "@/lib/confetti";

// Trening Stopera solo (SPEC §5.2, ostatni punkt „Wspólne").
//
// Świadomie BEZ pokoju, bez Firebase i bez silnika gry: to ma być coś, co odpalasz
// w kolejce do kasy. Cały stan żyje w tym komponencie, rekord w localStorage.
//
// Pomiar jak w trybie wieloosobowym: performance.now() przy starcie i stopie.
// setInterval służyłby tu wyłącznie do rysowania i i tak nie wolno go używać
// do liczenia czasu (zasada 6) — a że cyfry są zamaskowane, nie rysujemy nic.

const CELE = [5, 7, 10, 15] as const;
const IDEALNE_MS = 50; // < 0,05 s to „idealne trafienie" (SPEC §5.2)
const KLUCZ_REKORDU = "stoper-trening-rekord";

type Faza = "gotowy" | "mierzy" | "wynik" | "uniewazniona";

const fmt = (ms: number) => (ms / 1000).toFixed(2).replace(".", ",");

function odczytajRekord(): number | null {
  try {
    const v = localStorage.getItem(KLUCZ_REKORDU);
    return v == null ? null : Number(v);
  } catch {
    return null; // prywatne okno — trening działa, tylko bez rekordu
  }
}

export default function TreningStoperaPage() {
  const t = useT();
  const [celMs, setCelMs] = useState(10000);
  const [faza, setFaza] = useState<Faza>("gotowy");
  const [bladMs, setBladMs] = useState<number | null>(null);
  const [rekord, setRekord] = useState<number | null>(null);
  const t0 = useRef(0);

  useEffect(() => setRekord(odczytajRekord()), []);

  const start = useCallback(() => {
    unlockAudio();
    t0.current = performance.now();
    setBladMs(null);
    setFaza("mierzy");
    sfx.start();
    vibrate(30);
  }, []);

  const stop = useCallback(() => {
    const zmierzone = performance.now() - t0.current;
    const blad = zmierzone - celMs;
    setBladMs(blad);
    setFaza("wynik");
    sfx.stop();
    vibrate(30);

    const bezwzgledny = Math.abs(blad);
    // Idealne trafienie ma własny dźwięk i złote konfetti (SPEC §5.2) — te same,
    // których używa tryb wieloosobowy, żeby nagroda była rozpoznawalna.
    if (bezwzgledny < IDEALNE_MS) {
      sfx.perfect();
      celebrateGold();
    }
    setRekord((poprzedni) => {
      if (poprzedni != null && poprzedni <= bezwzgledny) return poprzedni;
      try {
        localStorage.setItem(KLUCZ_REKORDU, String(Math.round(bezwzgledny)));
      } catch {
        /* brak localStorage — rekord przeżyje tylko tę sesję */
      }
      return Math.round(bezwzgledny);
    });
  }, [celMs]);

  // Zmiana karty w trakcie pomiaru unieważnia próbę — ta sama zasada co w grze
  // wieloosobowej, choć tu nie ma kogo oszukiwać poza sobą.
  useEffect(() => {
    if (faza !== "mierzy") return;
    const onHide = () => {
      if (document.visibilityState === "hidden") setFaza("uniewazniona");
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [faza]);

  // Spacja jak w trybie wieloosobowym — na laptopie to naturalny odruch.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (faza === "mierzy") stop();
      else start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [faza, start, stop]);

  const idealne = bladMs != null && Math.abs(bladMs) < IDEALNE_MS;

  return (
    <main className="arcade-bg screen relative items-center gap-6 overflow-hidden text-center">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />

      <h1 className="font-display relative text-3xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_4px_0_rgb(0_0_0/0.35)]">
        {t("trening.title")}
      </h1>

      <div className="relative flex flex-col items-center gap-1">
        <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
          {t("stoper.target")}
        </span>
        <span className="tabular text-5xl font-bold text-bursztyn">{fmt(celMs)} s</span>
      </div>

      {faza === "gotowy" && (
        <div className="relative flex flex-wrap justify-center gap-2">
          {CELE.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setCelMs(s * 1000)}
              aria-pressed={celMs === s * 1000}
              className={`font-display rounded-[14px] border-[3px] px-4 py-2 text-sm font-bold uppercase tracking-[0.04em] ${
                celMs === s * 1000 ? "border-mint bg-mint/20 text-ink" : "border-stroke bg-panel text-ink-muted"
              }`}
            >
              {s} s
            </button>
          ))}
        </div>
      )}

      {faza === "mierzy" ? (
        <>
          <p className="tabular relative text-5xl text-ink-muted">●●:●●.●●</p>
          <button
            type="button"
            onClick={stop}
            className="font-display relative flex size-44 items-center justify-center gap-2 rounded-full border-[5px] border-bursztyn bg-panel-hi text-3xl font-bold uppercase tracking-[0.06em] text-bursztyn shadow-[0_6px_0_color-mix(in_srgb,var(--color-bursztyn)_45%,black)] transition-transform duration-75 active:translate-y-[6px] active:shadow-none"
          >
            <Square size={28} strokeWidth={3} aria-hidden /> {t("stoper.stop")}
          </button>
        </>
      ) : faza === "uniewazniona" ? (
        <>
          <p className="relative max-w-xs text-base font-semibold text-czerwien">{t("stoper.busted")}</p>
          <button type="button" onClick={start} className="btn relative">
            <RotateCcw size={18} strokeWidth={2.5} aria-hidden /> {t("trening.again")}
          </button>
        </>
      ) : faza === "wynik" && bladMs != null ? (
        <>
          <p className={`tabular relative text-5xl font-bold ${idealne ? "text-mint" : "text-ink"}`}>
            {bladMs >= 0 ? "+" : "−"}
            {fmt(Math.abs(bladMs))} s
          </p>
          <p className="font-display relative text-sm font-bold uppercase tracking-[0.06em] text-ink-muted">
            {idealne ? t("stoper.perfect") : bladMs >= 0 ? t("trening.late") : t("trening.early")}
          </p>
          <button type="button" onClick={start} className="btn relative">
            <RotateCcw size={18} strokeWidth={2.5} aria-hidden /> {t("trening.again")}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={start}
            className="font-display relative flex size-44 items-center justify-center gap-2 rounded-full border-[5px] border-white bg-bursztyn text-3xl font-bold uppercase tracking-[0.06em] text-black shadow-[0_6px_0_color-mix(in_srgb,var(--color-bursztyn)_55%,black)] transition-transform duration-75 active:translate-y-[6px] active:shadow-none"
          >
            <Play size={30} strokeWidth={3} aria-hidden /> {t("stoper.start")}
          </button>
          <p className="relative max-w-xs text-sm font-semibold text-ink-muted">{t("stoper.hint")}</p>
        </>
      )}

      {rekord != null && (
        <p className="font-display relative inline-flex items-center gap-2 rounded-[14px] border-[3px] border-stroke bg-panel px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
          <Trophy size={15} strokeWidth={2.5} aria-hidden /> {t("trening.best", { time: fmt(rekord) })}
        </p>
      )}

      <Link
        href="/"
        className="font-display relative mt-auto text-sm font-bold uppercase tracking-[0.06em] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        {t("common.back")}
      </Link>
    </main>
  );
}
