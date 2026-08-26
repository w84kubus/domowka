"use client";
import { Flag, Target, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GameViewProps } from "@/games/view";
import { useT } from "@/lib/i18n/provider";
import { sfx, vibrate } from "@/lib/sound";
import { useSent } from "@/games/useOptimistic";
import { AvatarIcon } from "@/components/AvatarIcon";
import { ZgadnijView, type ZgadnijPublic } from "./ZgadnijView";

interface PublicState {
  mode: string;
  round: number;
  totalRounds: number;
  phase: "pomiar" | "oczekiwanie" | "bieg" | "typowanie" | "odsloniecie" | "koniec";
  actualMs?: number | null;
  target: number;
  submitted: string[];
  players: { uid: string; nick: string; avatar: string; score: number }[];
  reveal:
    | { uid: string; valueMs: number | null; errorMs: number | null; signedMs: number | null; suspicious: boolean; perfect: boolean; busted: boolean }[]
    | null;
  perfectHits: string[];
}

const fmt = (ms: number) => (ms / 1000).toFixed(2).replace(".", ",") + " s";
// `t` argumentem, bo to zwykła funkcja poza komponentem — hooka użyć nie może.
function signed(ms: number, t: ReturnType<typeof useT>) {
  const s = (Math.abs(ms) / 1000).toFixed(2).replace(".", ",");
  if (ms > 0) return t("stoper.tooLate", { s });
  if (ms < 0) return t("stoper.tooEarly", { s });
  return "±0,00 s";
}

export function StoperPlayerView({ publicState, privateState, meUid, isHost, dispatch, accent }: GameViewProps) {
  const t = useT();
  const pub = publicState as PublicState;
  const priv = privateState as { submitted: boolean; myValueMs: number | null; myGuessMs: number | null } | null;

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

  // Potwierdzenie zamknięcia rundy (akcja niszcząca dla całego pokoju).
  const [confirmClose, setConfirmClose] = useState(false);
  // Nowa runda albo zmiana fazy rozbraja potwierdzenie — nie może zostać „uzbrojone".
  useEffect(() => {
    setConfirmClose(false);
  }, [pub.round, pub.phase]);

  // Gra na laptopie: spacja = START, a potem STOP (SPEC §5.2 — duży przycisk, tu też klawisz).
  useEffect(() => {
    // Podpięte na CAŁĄ fazę pomiaru — także po zatrzymaniu. Wcześniej handler odpinał się
    // przy `submitted`, więc spacja przestawała być blokowana i aktywowała przycisk, który
    // akurat miał fokus. Gdy był nim „Zamknij rundę", host jednym naciśnięciem zamykał
    // rundę wszystkim — wyglądało to, jakby gra sama ją przeskoczyła.
    if (pub.phase !== "pomiar") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (e.repeat) return; // trzymanie spacji nie liczy się wielokrotnie
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault(); // blokuje przewijanie i aktywację przycisku z fokusem
      if (submitted) return; // po zatrzymaniu spacja nie robi już nic — ale nadal nic nie klika
      if (measuring) stop();
      else start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // start/stop pochodzą z bieżącego renderu; re-bind przy zmianie measuring/submitted/fazy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pub.phase, submitted, measuring]);

  // Tryb B ma własne fazy przed odsłonięciem; wyniki są wspólne dla obu trybów.
  if (pub.mode === "zgadnij" && (pub.phase === "oczekiwanie" || pub.phase === "bieg" || pub.phase === "typowanie")) {
    return (
      <ZgadnijView
        pub={pub as unknown as ZgadnijPublic}
        meUid={meUid}
        myGuessMs={priv?.myGuessMs ?? null}
        dispatch={dispatch}
        accent={accent}
      />
    );
  }

  // ODSŁONIĘCIE / KONIEC
  if (pub.phase !== "pomiar") {
    const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
    const iWon = pub.perfectHits.includes(meUid);
    return (
      <div className="flex flex-col gap-4" style={{ ["--accent" as string]: accent }}>
        <h2 className="font-display text-center text-2xl font-bold uppercase tracking-wide text-ink">
          {pub.phase === "koniec" ? <>{t("stoper.gameOver")} <Flag size={20} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /></> : t("stoper.roundResults", { round: pub.round })}
        </h2>
        {pub.mode === "zgadnij" && pub.actualMs != null && (
          <p className="text-center">
            <span className="font-display block text-sm font-bold uppercase tracking-[0.2em] text-ink-muted">
              {t("stoper.realTime")}
            </span>
            <span className="tabular text-4xl font-bold" style={{ color: accent }}>{fmt(pub.actualMs)}</span>
          </p>
        )}

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
                {r.uid === meUid && <> {t("common.you")}</>}
                {r.suspicious && <span title={t("stoper.suspicious")}> <TriangleAlert size={15} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /></span>}
              </span>
              <span className="tabular text-right text-sm">
                {r.valueMs == null ? (
                  <span className="text-[var(--color-ink-muted)]">brak</span>
                ) : r.busted ? (
                  <>
                    <div className="text-czerwien">{fmt(r.valueMs)}</div>
                    <div className="font-display text-xs font-bold uppercase text-czerwien">spalone</div>
                  </>
                ) : (
                  <>
                    <div>{fmt(r.valueMs)}</div>
                    <div className="text-xs text-[var(--color-ink-muted)]">{signed(r.signedMs ?? 0, t)}</div>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-2">
          <h3 className="font-display mb-2 text-sm font-bold uppercase tracking-[0.06em] text-mint">
            {t("common.total")}
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
            {t("stoper.perfect")} <Target size={22} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden />
          </p>
        )}

        {isHost && pub.phase === "odsloniecie" && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn btn-accent"
              style={{ ["--accent" as string]: accent }}
              onClick={() => dispatch({ type: "NEXT" })}
            >
              {t("common.next")}
            </button>
            {/* „Zakończ grę" renderuje teraz GameShell dla wszystkich gier naraz —
                Stoper zgłasza tylko canFinish w publicView. */}
          </div>
        )}
      </div>
    );
  }

  // POMIAR
  return (
    <div className="flex flex-col items-center gap-6" style={{ ["--accent" as string]: accent }}>
      <div className="text-center">
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-muted">
          {t("common.round")} {pub.round}{pub.totalRounds ? ` / ${pub.totalRounds}` : ""} · {t("stoper.target")}
        </p>
        <p className="tabular text-5xl font-bold" style={{ color: accent }}>{fmt(pub.target)}</p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="tabular text-3xl text-ink-muted">●●:●●.●●</p>
          <p className="text-lg font-bold text-ink">{t("stoper.waiting")}</p>
          <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-mint">
            {t("stoper.readyCount", { done: pub.submitted.length, all: pub.players.length })}
          </p>
        </div>
      ) : (
        <>
          <p className="tabular text-4xl text-ink-muted">●●:●●.●●</p>
          {invalidated && (
            <p className="rounded-[14px] border-2 border-czerwien/50 bg-czerwien/20 px-3 py-2 text-sm font-bold text-white">
              {t("stoper.busted")}
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
              {t("stoper.start")}
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
              {t("stoper.stop")}
            </button>
          )}
          <p className="text-center text-sm font-semibold text-ink-muted">
            {t("stoper.hint")}
          </p>
          {/* Podpowiedź o spacji tylko na urządzeniach z fizyczną klawiaturą (laptop). */}
          <p className="hidden text-center text-xs font-semibold text-ink-muted [@media(pointer:fine)]:block">
            {t("stoper.laptopHint")}{" "}
            <kbd className="rounded-md border-2 border-stroke bg-panel px-1.5 py-0.5 font-bold">
              {t("stoper.space")}
            </kbd>{" "}
            = {measuring ? t("stoper.stop") : t("stoper.start")}
          </p>
        </>
      )}

      {isHost && (
        <button
          type="button"
          className="btn btn-ghost mt-2 text-sm"
          onClick={() => {
            // Dwa kroki: zamknięcie rundy przepada wszystkim, którzy jeszcze nie zdążyli,
            // więc jeden przypadkowy tap (albo spacja z fokusem) nie może tego zrobić.
            if (!confirmClose) {
              setConfirmClose(true);
              return;
            }
            setConfirmClose(false);
            dispatch({ type: "NEXT" });
          }}
          onBlur={() => setConfirmClose(false)}
        >
          {confirmClose ? t("stoper.closeConfirm") : t("stoper.closeRound")}
        </button>
      )}
    </div>
  );
}
