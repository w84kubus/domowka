"use client";
import { Flag, Target, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GameViewProps } from "@/games/view";
import { sfx, vibrate } from "@/lib/sound";
import { useSent } from "@/games/useOptimistic";
import { AvatarIcon } from "@/components/AvatarIcon";

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
  const [sentStop, markStop] = useSent(pub.round); // natychmiast pokaż „Zatrzymano" po STOP

  const submitted = priv?.submitted || pub.submitted.includes(meUid) || sentStop;

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
    markStop(); // od razu pokaż „Zatrzymano", nie czekaj na snapshot
    sfx.stop();
    vibrate(30);
    dispatch({ type: "SUBMIT", valueMs: Math.round(elapsed) }).catch(() => {});
  };

  // Gra na laptopie: spacja = START, a potem STOP (SPEC §5.2 — duży przycisk, tu też klawisz).
  useEffect(() => {
    if (pub.phase !== "pomiar" || submitted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (e.repeat) return; // trzymanie spacji nie liczy się wielokrotnie
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault(); // blokuje przewijanie strony i podwójne wyzwolenie z fokusa przycisku
      if (measuring) stop();
      else start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // start/stop pochodzą z bieżącego renderu; re-bind przy zmianie measuring/submitted/fazy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pub.phase, submitted, measuring]);

  // ODSŁONIĘCIE / KONIEC
  if (pub.phase !== "pomiar") {
    const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
    const iWon = pub.perfectHits.includes(meUid);
    return (
      <div className="flex flex-col gap-4" style={{ ["--accent" as string]: accent }}>
        <h2 className="font-display text-center text-2xl font-bold uppercase tracking-wide text-ink">
          {pub.phase === "koniec" ? <>Koniec gry <Flag size={20} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /></> : `Runda ${pub.round} — wyniki`}
        </h2>
        <ol className="flex flex-col gap-2">
          {(pub.reveal ?? []).map((r, i) => (
            <li
              key={r.uid}
              className="flex items-center gap-3 rounded-[14px] border-[3px] border-stroke bg-panel px-3 py-3 shadow-[0_3px_0_rgb(0_0_0/0.35)]"
              style={r.perfect ? { borderColor: accent, boxShadow: `0 3px 0 ${accent}` } : undefined}
            >
              <span className="tabular w-6 text-center text-lg font-bold text-ink-muted">{i + 1}</span>
              <span className="flex-1 truncate font-bold text-ink">
                {nickOf(r.uid)}
                {r.uid === meUid && " (Ty)"}
                {r.suspicious && <span title="podejrzany wynik"> <TriangleAlert size={15} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /></span>}
              </span>
              <span className="tabular text-right text-sm">
                {r.valueMs == null ? (
                  <span className="text-[var(--color-ink-muted)]">brak</span>
                ) : (
                  <>
                    <div>{fmt(r.valueMs)}</div>
                    <div className="text-xs text-[var(--color-ink-muted)]">{signed(r.signedMs ?? 0)}</div>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-2">
          <h3 className="font-display mb-2 text-sm font-bold uppercase tracking-[0.06em] text-mint">
            Wyniki ogółem
          </h3>
          <ul className="flex flex-col gap-1">
            {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
              <li key={p.uid} className="flex justify-between px-1 text-base font-semibold">
                <span><AvatarIcon avatar={p.avatar} size={18} /> {p.nick}</span>
                <span className="tabular font-bold">{p.score}</span>
              </li>
            ))}
          </ul>
        </div>

        {iWon && (
          <p className="font-display text-center text-lg font-bold uppercase" style={{ color: accent }}>
            Idealne trafienie! <Target size={22} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden />
          </p>
        )}

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
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-muted">
          Runda {pub.round}{pub.totalRounds ? ` / ${pub.totalRounds}` : ""} · Cel
        </p>
        <p className="tabular text-5xl font-bold" style={{ color: accent }}>{fmt(pub.target)}</p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="tabular text-3xl text-ink-muted">●●:●●.●●</p>
          <p className="text-lg font-bold text-ink">Zatrzymano. Czekamy na resztę…</p>
          <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-mint">
            {pub.submitted.length} / {pub.players.length} gotowych
          </p>
        </div>
      ) : (
        <>
          <p className="tabular text-4xl text-ink-muted">●●:●●.●●</p>
          {invalidated && (
            <p className="rounded-[14px] border-2 border-czerwien/50 bg-czerwien/20 px-3 py-2 text-sm font-bold text-white">
              Nie zmieniaj karty — próba unieważniona.
            </p>
          )}
          {!measuring ? (
            <button
              onClick={start}
              className="font-display flex size-40 items-center justify-center rounded-full border-[5px] border-white text-3xl font-bold uppercase tracking-[0.06em] text-black transition-transform duration-75 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint focus-visible:outline-offset-4 active:translate-y-[6px] active:shadow-none"
              style={{
                background: accent,
                boxShadow: `0 6px 0 color-mix(in srgb, ${accent} 55%, black)`,
              }}
            >
              START
            </button>
          ) : (
            <button
              onClick={stop}
              className="font-display flex size-40 items-center justify-center rounded-full border-[5px] bg-panel-hi text-3xl font-bold uppercase tracking-[0.06em] transition-transform duration-75 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint focus-visible:outline-offset-4 active:translate-y-[6px] active:shadow-none"
              style={{
                borderColor: accent,
                color: accent,
                boxShadow: `0 6px 0 color-mix(in srgb, ${accent} 45%, black)`,
              }}
            >
              STOP
            </button>
          )}
          <p className="text-center text-sm font-semibold text-ink-muted">
            Zatrzymaj jak najbliżej celu. Cyfry są ukryte — licz w głowie.
          </p>
          {/* Podpowiedź o spacji tylko na urządzeniach z fizyczną klawiaturą (laptop). */}
          <p className="hidden text-center text-xs font-semibold text-ink-muted [@media(pointer:fine)]:block">
            Na laptopie:{" "}
            <kbd className="rounded-md border-2 border-stroke bg-panel px-1.5 py-0.5 font-bold">
              spacja
            </kbd>{" "}
            = {measuring ? "STOP" : "START"}
          </p>
        </>
      )}

      {isHost && (
        <button
          className="btn btn-ghost mt-2 text-sm"
          onClick={() => dispatch({ type: "NEXT" })}
        >
          Zamknij rundę
        </button>
      )}
    </div>
  );
}
