"use client";
import { useEffect, useRef, useState } from "react";
import type { GameViewProps } from "@/games/view";
import { sfx, vibrate } from "@/lib/sound";

interface PublicState {
  mode: string;
  round: number;
  totalRounds: number;
  phase: "pomiar" | "odsloniecie" | "koniec";
  target: number;
  submitted: string[];
  players: { uid: string; nick: string; avatar: string; score: number }[];
  reveal:
    | { uid: string; valueMs: number | null; errorMs: number | null; signedMs: number | null; suspicious: boolean; perfect: boolean }[]
    | null;
  perfectHits: string[];
}

const fmt = (ms: number) => (ms / 1000).toFixed(2).replace(".", ",") + " s";
function signed(ms: number) {
  const s = (Math.abs(ms) / 1000).toFixed(2).replace(".", ",");
  if (ms > 0) return `+${s} s ZA PÓŹNO`;
  if (ms < 0) return `−${s} s ZA WCZEŚNIE`;
  return "±0,00 s";
}

export function StoperPlayerView({ publicState, privateState, meUid, isHost, dispatch, accent }: GameViewProps) {
  const pub = publicState as PublicState;
  const priv = privateState as { submitted: boolean; myValueMs: number | null } | null;

  const [measuring, setMeasuring] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const t0 = useRef(0);

  const submitted = priv?.submitted || pub.submitted.includes(meUid);

  // Zmiana karty w trakcie pomiaru unieważnia próbę (SPEC §5.2).
  useEffect(() => {
    if (!measuring) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        setMeasuring(false);
        setInvalidated(true);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [measuring]);

  // Reset lokalnego stanu przy zmianie rundy.
  useEffect(() => {
    setMeasuring(false);
    setInvalidated(false);
  }, [pub.round, pub.phase]);

  const start = () => {
    setInvalidated(false);
    t0.current = performance.now(); // NIGDY setInterval (SPEC §5.2)
    setMeasuring(true);
    sfx.start();
    vibrate(20);
  };
  const stop = () => {
    const elapsed = performance.now() - t0.current;
    setMeasuring(false);
    sfx.stop();
    vibrate(30);
    dispatch({ type: "SUBMIT", valueMs: Math.round(elapsed) }).catch(() => {});
  };

  // ODSŁONIĘCIE / KONIEC
  if (pub.phase !== "pomiar") {
    const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
    const iWon = pub.perfectHits.includes(meUid);
    return (
      <div className="flex flex-col gap-4" style={{ ["--accent" as string]: accent }}>
        <h2 className="text-center text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {pub.phase === "koniec" ? "Koniec gry 🏁" : `Runda ${pub.round} — wyniki`}
        </h2>
        <ol className="flex flex-col gap-2">
          {(pub.reveal ?? []).map((r, i) => (
            <li
              key={r.uid}
              className="card flex items-center gap-3 px-4 py-3"
              style={r.perfect ? { borderColor: accent, boxShadow: `0 0 18px ${accent}55` } : undefined}
            >
              <span className="tabular w-6 text-center text-lg font-bold text-[var(--color-tekst-drugi)]">{i + 1}</span>
              <span className="flex-1 truncate font-semibold">
                {nickOf(r.uid)}
                {r.uid === meUid && " (Ty)"}
                {r.suspicious && <span title="podejrzany wynik"> ⚠</span>}
              </span>
              <span className="tabular text-right text-sm">
                {r.valueMs == null ? (
                  <span className="text-[var(--color-tekst-drugi)]">brak</span>
                ) : (
                  <>
                    <div>{fmt(r.valueMs)}</div>
                    <div className="text-xs text-[var(--color-tekst-drugi)]">{signed(r.signedMs ?? 0)}</div>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-2">
          <h3 className="mb-2 text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">Wyniki ogółem</h3>
          <ul className="flex flex-col gap-1">
            {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
              <li key={p.uid} className="flex justify-between px-1 text-sm">
                <span>{p.avatar} {p.nick}</span>
                <span className="tabular font-bold">{p.score}</span>
              </li>
            ))}
          </ul>
        </div>

        {iWon && <p className="text-center font-bold" style={{ color: accent }}>Idealne trafienie! 🎯</p>}

        {isHost && pub.phase === "odsloniecie" && (
          <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>
            Dalej →
          </button>
        )}
      </div>
    );
  }

  // POMIAR
  return (
    <div className="flex flex-col items-center gap-6" style={{ ["--accent" as string]: accent }}>
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">
          Runda {pub.round}{pub.totalRounds ? ` / ${pub.totalRounds}` : ""} · Cel
        </p>
        <p className="tabular text-5xl font-bold" style={{ color: accent }}>{fmt(pub.target)}</p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="tabular text-3xl text-[var(--color-tekst-drugi)]">●●:●●.●●</p>
          <p className="text-[var(--color-tekst-drugi)]">Zatrzymano. Czekamy na resztę…</p>
          <p className="text-sm text-[var(--color-tekst-drugi)]">
            {pub.submitted.length} / {pub.players.length} gotowych
          </p>
        </div>
      ) : (
        <>
          <p className="tabular text-4xl text-[var(--color-tekst-drugi)]">●●:●●.●●</p>
          {invalidated && <p className="text-sm text-[var(--color-magenta)]">Nie zmieniaj karty 😉 — próba unieważniona.</p>}
          {!measuring ? (
            <button
              onClick={start}
              className="flex h-40 w-40 items-center justify-center rounded-full text-3xl font-bold text-black"
              style={{ background: accent, boxShadow: `0 0 40px ${accent}66`, fontFamily: "var(--font-display)" }}
            >
              START
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex h-40 w-40 items-center justify-center rounded-full border-4 text-3xl font-bold"
              style={{ borderColor: accent, color: accent, fontFamily: "var(--font-display)" }}
            >
              STOP
            </button>
          )}
          <p className="text-center text-xs text-[var(--color-tekst-drugi)]">
            Zatrzymaj jak najbliżej celu. Cyfry są ukryte — licz w głowie.
          </p>
        </>
      )}

      {isHost && (
        <button className="btn mt-2 text-sm" onClick={() => dispatch({ type: "NEXT" })}>
          Zamknij rundę i pokaż wyniki
        </button>
      )}
    </div>
  );
}
