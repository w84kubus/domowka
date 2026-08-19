"use client";
import { Ear, Minus, Play, Plus, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sfx, vibrate } from "@/lib/sound";
import { AvatarIcon } from "@/components/AvatarIcon";

// Tryb B „ZGADNIJ CZAS" (SPEC §5.2): jeden Biegacz mierzy, reszta szacuje ze słuchu.
// Nikt nie widzi cyfr — biegacz też nie. Pomiar lokalny przez performance.now (SPEC §5.2).

export interface ZgadnijPublic {
  mode: string;
  phase: "oczekiwanie" | "bieg" | "typowanie" | "odsloniecie" | "koniec";
  round: number;
  totalRounds: number;
  runnerUid: string | null;
  guessed: string[];
  actualMs: number | null;
  players: { uid: string; nick: string; avatar: string; score: number }[];
}

const fmt = (ms: number) => (ms / 1000).toFixed(2).replace(".", ",") + " s";

export function ZgadnijView({
  pub,
  meUid,
  myGuessMs,
  dispatch,
  accent,
}: {
  pub: ZgadnijPublic;
  meUid: string;
  myGuessMs: number | null;
  dispatch: (a: unknown) => Promise<void>;
  accent: string;
}) {
  const amRunner = pub.runnerUid === meUid;
  const runner = pub.players.find((p) => p.uid === pub.runnerUid);
  const t0 = useRef(0);
  const [guess, setGuess] = useState(5);
  const [sent, setSent] = useState(false);

  // Rozgłoszenie startu i stopu — to jest cała zabawa (SPEC §5.2): reszta szacuje ze słuchu.
  const prevPhase = useRef(pub.phase);
  useEffect(() => {
    if (prevPhase.current === pub.phase) return;
    if (pub.phase === "bieg") {
      sfx.start();
      vibrate(30);
    }
    if (pub.phase === "typowanie") {
      sfx.stop();
      vibrate(30);
    }
    prevPhase.current = pub.phase;
  }, [pub.phase]);

  useEffect(() => setSent(false), [pub.round]);

  const alreadyGuessed = myGuessMs != null || pub.guessed.includes(meUid) || sent;

  // —— CZEKAMY NA BIEGACZA ——
  if (pub.phase === "oczekiwanie") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <Runda pub={pub} />
        {amRunner ? (
          <>
            <p className="text-lg font-bold text-ink">Twoja kolej. Biegniesz Ty.</p>
            <button
              type="button"
              onClick={() => {
                t0.current = performance.now();
                dispatch({ type: "RUN_START" }).catch(() => {});
              }}
              className="font-display flex size-40 items-center justify-center gap-2 rounded-full border-[5px] border-white text-3xl font-bold uppercase tracking-[0.06em] text-black transition-transform duration-75 active:translate-y-[6px]"
              style={{ background: accent, boxShadow: `0 6px 0 color-mix(in srgb, ${accent} 55%, black)` }}
            >
              <Play size={28} strokeWidth={3} aria-hidden /> Start
            </button>
            <p className="text-sm font-semibold text-ink-muted">
              Zatrzymaj kiedy chcesz. Nikt nie widzi cyfr — Ty też nie.
            </p>
          </>
        ) : (
          <>
            <span className="flex size-24 items-center justify-center rounded-full border-[5px] border-white bg-panel-hi">
              <AvatarIcon avatar={runner?.avatar ?? ""} size={52} />
            </span>
            <p className="text-lg font-bold text-ink">Biegnie {runner?.nick ?? "…"}</p>
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
              <Ear size={18} strokeWidth={2.5} aria-hidden /> Słuchaj uważnie — usłyszysz start i stop.
            </p>
          </>
        )}
      </div>
    );
  }

  // —— BIEG ——
  if (pub.phase === "bieg") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <Runda pub={pub} />
        <p className="tabular text-5xl text-ink-muted">●●:●●.●●</p>
        {amRunner ? (
          <button
            type="button"
            onClick={() => {
              const ms = Math.round(performance.now() - t0.current);
              vibrate(30);
              dispatch({ type: "RUN_STOP", valueMs: ms }).catch(() => {});
            }}
            className="font-display flex size-40 items-center justify-center gap-2 rounded-full border-[5px] bg-panel-hi text-3xl font-bold uppercase tracking-[0.06em] transition-transform duration-75 active:translate-y-[6px]"
            style={{ borderColor: accent, color: accent, boxShadow: `0 6px 0 color-mix(in srgb, ${accent} 45%, black)` }}
          >
            <Square size={26} strokeWidth={3} aria-hidden /> Stop
          </button>
        ) : (
          <p className="text-lg font-bold text-ink">{runner?.nick ?? "Biegacz"} biegnie… licz w głowie!</p>
        )}
      </div>
    );
  }

  // —— TYPOWANIE ——
  if (pub.phase === "typowanie") {
    const step = (d: number) => setGuess((g) => Math.max(0, Math.round((g + d) * 100) / 100));
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <Runda pub={pub} />
        {alreadyGuessed ? (
          <>
            <p className="text-lg font-bold text-ink">Typ zapisany. Czekamy na resztę…</p>
            <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-mint">
              {pub.guessed.length} / {pub.players.length} gotowych
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-ink">Ile trwał bieg?</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Mniej"
                onClick={() => step(-0.1)}
                className="flex size-14 items-center justify-center rounded-[14px] border-[3px] border-stroke bg-panel shadow-[0_3px_0_rgb(0_0_0/0.35)] active:translate-y-[3px]"
              >
                <Minus size={24} strokeWidth={3} aria-hidden />
              </button>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={guess}
                onChange={(e) => setGuess(Math.max(0, Number(e.target.value) || 0))}
                aria-label="Twój typ w sekundach"
                className="tabular w-40 rounded-[14px] border-[3px] border-stroke bg-panel px-3 py-3 text-center text-3xl font-bold text-ink"
              />
              <button
                type="button"
                aria-label="Więcej"
                onClick={() => step(0.1)}
                className="flex size-14 items-center justify-center rounded-[14px] border-[3px] border-stroke bg-panel shadow-[0_3px_0_rgb(0_0_0/0.35)] active:translate-y-[3px]"
              >
                <Plus size={24} strokeWidth={3} aria-hidden />
              </button>
            </div>
            <button
              type="button"
              className="btn btn-accent"
              style={{ ["--accent" as string]: accent }}
              onClick={() => {
                setSent(true);
                dispatch({ type: "GUESS", valueMs: Math.round(guess * 1000) }).catch(() => setSent(false));
              }}
            >
              Zgaduję {fmt(Math.round(guess * 1000))}
            </button>
          </>
        )}
      </div>
    );
  }

  return null; // odsłonięcie i koniec renderuje wspólny widok wyników
}

function Runda({ pub }: { pub: ZgadnijPublic }) {
  return (
    <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-muted">
      Runda {pub.round}
      {pub.totalRounds ? ` / ${pub.totalRounds}` : ""}
    </p>
  );
}
