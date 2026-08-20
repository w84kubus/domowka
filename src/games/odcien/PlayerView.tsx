"use client";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { vibrate } from "@/hooks/useVibrate";
import type { GameViewProps } from "@/games/view";
import { hexOf, hslToRgb, rgbToHsl, type Rgb } from "./color";

interface Pub {
  phase: "pokaz" | "zgadywanie" | "wynik" | "koniec";
  round: number;
  totalRounds: number;
  space: "rgb" | "hsl";
  submitted: string[];
  target?: string;
  players: { uid: string; nick: string; avatar: string; score: number }[];
  results?: { uid: string; hex: string; deltaE: number; accuracy: number }[];
  perfect?: string[];
}

const START: Rgb = { r: 128, g: 128, b: 128 };

export function OdcienPlayerView({ publicState, meUid, isHost, dispatch }: GameViewProps) {
  const t = useT();
  const pub = publicState as Pub;
  const [rgb, setRgb] = useState<Rgb>(START);
  const [busy, setBusy] = useState(false);

  // Nowa runda zeruje suwaki — inaczej gracz zaczyna od poprzedniej odpowiedzi,
  // co przy podobnych kolorach daje niezasłużoną przewagę.
  useEffect(() => {
    setRgb(START);
    setBusy(false);
  }, [pub.round]);

  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const myHex = hexOf(rgb);
  const sent = pub.submitted.includes(meUid);

  // Aktualizacja FUNKCYJNA (prev => ...), nie z domknięcia. Ta aplikacja renderuje się
  // bez przerwy (snapshoty Firestore, pingi obecności, tick fazy), a onChange suwaka leci
  // wielokrotnie na sekundę. Handler domykający `rgb`/`hsl` zapisywał nieaktualne wartości
  // pozostałych składowych i je cofał — wyglądało to jak „suwak nie działa, dopóki nie
  // ruszę innego". Z prev takie wyścigi są niemożliwe.
  const setHsl = (patch: Partial<{ h: number; s: number; l: number }>) => {
    setRgb((prev) => {
      const cur = rgbToHsl(prev);
      const next = { ...cur, ...patch };
      return hslToRgb(next.h, next.s, next.l);
    });
  };

  const send = async () => {
    setBusy(true);
    vibrate(15);
    try {
      await dispatch({ type: "SUBMIT", color: rgb });
    } catch {
      setBusy(false);
    }
  };

  // ——— FAZA POKAZU ———
  if (pub.phase === "pokaz") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-muted">
          {t("common.round")} {pub.round}
          {pub.totalRounds > 0 && ` / ${pub.totalRounds}`}
        </p>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-ink">
          {t("odcien.memorise")}
        </p>
        <div
          className="h-56 w-full max-w-md rounded-[20px] border-[6px] border-white shadow-[0_6px_0_rgb(0_0_0/0.35)]"
          style={{ background: pub.target }}
          aria-label={t("odcien.memorise")}
        />
      </div>
    );
  }

  // ——— FAZA ZGADYWANIA ———
  if (pub.phase === "zgadywanie") {
    const sliders =
      pub.space === "rgb"
        ? ([
            { key: "r", label: "R", max: 255, value: rgb.r, on: (v: number) => setRgb((prev) => ({ ...prev, r: v })), track: "linear-gradient(to right,#000,#f00)" },
            { key: "g", label: "G", max: 255, value: rgb.g, on: (v: number) => setRgb((prev) => ({ ...prev, g: v })), track: "linear-gradient(to right,#000,#0f0)" },
            { key: "b", label: "B", max: 255, value: rgb.b, on: (v: number) => setRgb((prev) => ({ ...prev, b: v })), track: "linear-gradient(to right,#000,#00f)" },
          ] as const)
        : ([
            { key: "h", label: "H", max: 360, value: hsl.h, on: (v: number) => setHsl({ h: v }), track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" },
            { key: "s", label: "S", max: 100, value: hsl.s, on: (v: number) => setHsl({ s: v }), track: `linear-gradient(to right,#808080,${hexOf(hslToRgb(hsl.h, 100, 50))})` },
            { key: "l", label: "L", max: 100, value: hsl.l, on: (v: number) => setHsl({ l: v }), track: `linear-gradient(to right,#000,${hexOf(hslToRgb(hsl.h, hsl.s, 50))},#fff)` },
          ] as const);

    return (
      <div className="flex flex-col items-center gap-5">
        <p className="font-display text-lg font-bold uppercase tracking-wide text-ink">
          {t("odcien.rebuild")}
        </p>
        <div
          className="h-32 w-full max-w-md rounded-[20px] border-[6px] border-white shadow-[0_6px_0_rgb(0_0_0/0.35)]"
          style={{ background: myHex }}
          aria-label={`${t("odcien.yours")} ${myHex}`}
        />
        <p className="tabular text-sm font-bold uppercase text-ink-muted">{myHex}</p>

        <div className="flex w-full max-w-md flex-col gap-4">
          {sliders.map((s) => (
            <label key={s.key} className="flex items-center gap-3">
              <span className="font-display w-5 flex-none text-center text-base font-bold text-ink">{s.label}</span>
              <input
                type="range"
                min={0}
                max={s.max}
                value={s.value}
                disabled={sent || busy}
                onChange={(e) => s.on(Number(e.target.value))}
                className="odcien-slider flex-1"
                style={{ ["--track" as string]: s.track }}
                aria-label={s.label}
              />
              <span className="tabular w-10 flex-none text-right text-sm font-bold text-ink-muted">{s.value}</span>
            </label>
          ))}
        </div>

        {sent ? (
          <p className="font-display text-center text-base font-bold uppercase tracking-[0.06em] text-mint">
            {t("odcien.sent")}
          </p>
        ) : (
          <button type="button" className="btn w-full max-w-md" disabled={busy} onClick={send}>
            {busy ? t("common.loading") : t("odcien.submit")}
          </button>
        )}

        <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-muted">
          {t("odcien.submittedCount", { done: pub.submitted.length, all: pub.players.length })}
        </p>

        {isHost && !sent && (
          <button type="button" className="btn btn-ghost w-full max-w-md text-sm" onClick={() => dispatch({ type: "NEXT" })}>
            {t("odcien.closeRound")}
          </button>
        )}
      </div>
    );
  }

  // ——— ODSŁONIĘCIE / KONIEC ———
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-display text-lg font-bold uppercase tracking-wide text-ink">
        {t("common.round")} {pub.round} — {t("common.results")}
      </p>

      <div className="flex w-full max-w-md flex-col items-center gap-1">
        <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
          {t("odcien.target")}
        </span>
        <div
          className="h-24 w-full rounded-[20px] border-[6px] border-white shadow-[0_6px_0_rgb(0_0_0/0.35)]"
          style={{ background: pub.target }}
        />
        <span className="tabular text-sm font-bold uppercase text-ink-muted">{pub.target}</span>
      </div>

      <ul className="flex w-full max-w-md flex-col gap-2">
        {(pub.results ?? []).map((r, i) => (
          <li
            key={r.uid}
            className={`flex items-center gap-3 rounded-[14px] border-[3px] px-3 py-2 ${
              r.uid === meUid ? "border-mint bg-panel-hi" : "border-stroke bg-panel"
            }`}
          >
            <span className="font-display w-5 flex-none text-center text-sm font-bold text-ink-muted">{i + 1}</span>
            <span
              className="size-10 flex-none rounded-[10px] border-[3px] border-white"
              style={{ background: r.hex }}
              aria-label={r.hex}
            />
            <span className="min-w-0 flex-1 truncate font-bold text-ink">
              {nickOf(r.uid)}
              {r.uid === meUid && <span className="font-semibold text-ink-muted"> {t("common.you")}</span>}
            </span>
            <span className="tabular flex-none text-right text-sm font-bold text-ink">
              {r.accuracy}%
              <span className="block text-[0.65rem] font-semibold uppercase text-ink-muted">{t("odcien.accuracy")}</span>
            </span>
          </li>
        ))}
      </ul>

      {isHost && pub.phase === "wynik" && (
        <button type="button" className="btn w-full max-w-md" onClick={() => dispatch({ type: "NEXT" })}>
          {t("common.next")}
        </button>
      )}
    </div>
  );
}
