"use client";
import { Check, Flag, PartyPopper, Skull, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { GameViewProps } from "@/games/view";
import { useT } from "@/lib/i18n/provider";
import { sfx, vibrate } from "@/lib/sound";
import { Hangman, MaskedWord, PolishKeyboard } from "./ui";
import { usePendingSet } from "@/games/useOptimistic";
import { AvatarIcon } from "@/components/AvatarIcon";

type Cell = { ch: string | null; kind: "letter" | "space" | "punct" };
interface Pub {
  mode: "zadajacy" | "wyscig" | "kooperacja";
  round: number;
  totalRounds: number;
  phase: "ustawianie" | "zgadywanie" | "wynik" | "koniec";
  category: string;
  maxWrong: number;
  result: "gramy" | "wygrana" | "przegrana";
  winners: string[];
  players: { uid: string; nick: string; avatar: string; score: number; roundDelta: number }[];
  extraLetters: boolean;
  ignoreOgonki: boolean;
  mask?: Cell[] | null;
  hits?: string[];
  misses?: string[];
  wrong?: number;
  turnUid?: string | null;
  setterUid?: string | null;
  progress?: { uid: string; percent: number; wrong: number; solved: boolean; order: number }[];
}

function useTicker(ms = 300) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
const secLeft = (endsAt: number | null, now: number) => (endsAt == null ? null : Math.max(0, Math.ceil((endsAt - now) / 1000)));

export function WisielecPlayerView({ room, publicState, privateState, meUid, isHost, dispatch, serverNow, accent }: GameViewProps) {
  const t = useT();
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
  useTicker();
  const now = serverNow();

  const header = (
    <div className="text-center">
      <p className="text-sm uppercase tracking-widest text-[var(--color-ink-muted)]">
        {t("wisielec.roundMode", {
          round: pub.round,
          total: pub.totalRounds ? `/${pub.totalRounds}` : "",
          mode: t(`wisielec.mode.${pub.mode}` as const),
        })}
      </p>
      {pub.category && (
        <p className="text-lg font-semibold" style={{ color: accent }}>
          {t("wisielec.category", { category: pub.category })}
        </p>
      )}
    </div>
  );

  // ---- USTAWIANIE (zadający) ----
  if (pub.phase === "ustawianie") {
    const priv = privateState as { amSetter?: boolean } | null;
    return (
      <div className="flex flex-col gap-5" style={{ ["--accent" as string]: accent }}>
        {header}
        {priv?.amSetter ? <SetterInput dispatch={dispatch} accent={accent} /> : (
          <p className="text-center text-[var(--color-ink-muted)]">
            {t("wisielec.setterWorking", { nick: nickOf(pub.setterUid ?? "") })}
          </p>
        )}
      </div>
    );
  }

  // ---- WYNIK / KONIEC ----
  if (pub.phase === "wynik" || pub.phase === "koniec") {
    const won = pub.result === "wygrana";
    return (
      <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
        {header}
        {pub.mask && <MaskedWord mask={pub.mask} accent={accent} big />}
        <p className="text-2xl font-bold" style={{ color: won ? "#4ade80" : "var(--color-czerwien)" }}>
          {pub.phase === "koniec" ? <>{t("wisielec.gameOver")} <Flag size={20} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /></> : won ? <>{t("wisielec.solved")} <PartyPopper size={20} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /></> : <>{t("wisielec.hanged")} <Skull size={20} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /></>}
        </p>
        {pub.winners.length > 0 && <p className="text-sm text-[var(--color-ink-muted)]">{t("wisielec.winners", { nicks: pub.winners.map(nickOf).join(", ") })}</p>}
        <ul className="w-full max-w-sm">
          {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
            <li key={p.uid} className="flex justify-between px-2 py-1 text-sm">
              <span><AvatarIcon avatar={p.avatar} size={18} /> {p.nick}{p.uid === meUid && ` ${t("common.you")}`}</span>
              <span className="tabular"><b>{p.score}</b>{p.roundDelta > 0 && <span className="ml-2" style={{ color: accent }}>+{p.roundDelta}</span>}</span>
            </li>
          ))}
        </ul>
        {isHost && pub.phase === "wynik" && (
          <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>{t("common.next")}</button>
        )}
      </div>
    );
  }

  // ---- ZGADYWANIE ----
  if (pub.mode === "wyscig") {
    const priv = privateState as { mask: Cell[]; hits: string[]; misses: string[]; wrong: number; solved: boolean } | null;
    const done = priv?.solved || (priv ? priv.wrong >= pub.maxWrong : false);
    return (
      <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
        {header}
        <Hangman wrong={priv?.wrong ?? 0} maxWrong={pub.maxWrong} size={150} />
        {priv?.mask && <MaskedWord mask={priv.mask} accent={accent} />}
        {done ? (
          <p className="text-center font-semibold" style={{ color: priv?.solved ? "#4ade80" : "var(--color-czerwien)" }}>
            {priv?.solved ? t("wisielec.gotIt") : t("wisielec.outOfLives")}
          </p>
        ) : (
          <>
            <GuessControls hits={priv?.hits ?? []} misses={priv?.misses ?? []} dispatch={dispatch} disabled={false} extraLetters={pub.extraLetters} accent={accent} resetKey={room.version} />
          </>
        )}
        <ProgressBars pub={pub} nickOf={nickOf} accent={accent} />
      </div>
    );
  }

  // shared: zadający / kooperacja
  const myTurn = pub.turnUid === meUid;
  const amSetter = pub.setterUid === meUid; // zadający: setter nie zgaduje
  const left = secLeft(room.phaseEndsAt, now);
  return (
    <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
      {header}
      <Hangman wrong={pub.wrong ?? 0} maxWrong={pub.maxWrong} size={150} />
      {pub.mask && <MaskedWord mask={pub.mask} accent={accent} />}
      {amSetter ? (
        <p className="text-center text-[var(--color-ink-muted)]">{t("wisielec.youSet")}</p>
      ) : myTurn ? (
        <>
          <p className="text-sm font-semibold" style={{ color: accent }}>{t("wisielec.yourTurn")} {left != null ? `· ${left}s` : ""}</p>
          <GuessControls hits={pub.hits ?? []} misses={pub.misses ?? []} dispatch={dispatch} disabled={false} extraLetters={pub.extraLetters} accent={accent} resetKey={room.version} />
        </>
      ) : (
        <p className="text-center text-[var(--color-ink-muted)]">{t("wisielec.turn")} <b>{nickOf(pub.turnUid ?? "")}</b> {left != null ? `· ${left}s` : ""}</p>
      )}
    </div>
  );
}

function GuessControls({ hits, misses, dispatch, disabled, extraLetters, accent, resetKey }: {
  hits: string[]; misses: string[]; dispatch: (a: unknown) => Promise<void>; disabled: boolean; extraLetters: boolean; accent: string; resetKey: unknown;
}) {
  const [pending, addPending] = usePendingSet(resetKey);
  const guess = (l: string) => {
    addPending(l); // natychmiastowy feedback — klawisz „wciska się" od razu
    dispatch({ type: "GUESS", letter: l }).catch(() => {});
    vibrate(15);
    sfx.tick();
  };
  return (
    <div className="flex w-full flex-col gap-3">
      <PolishKeyboard hits={hits} misses={misses} onLetter={guess} disabled={disabled} extraLetters={extraLetters} pending={pending} />
      <SolveBox dispatch={dispatch} accent={accent} />
    </div>
  );
}

function SolveBox({ dispatch, accent }: { dispatch: (a: unknown) => Promise<void>; accent: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  if (!open) return <button className="btn" onClick={() => setOpen(true)}>{t("wisielec.guessWhole")}</button>;
  return (
    <div className="flex gap-2">
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        autoComplete="off"
        placeholder={t("wisielec.wholePlaceholder")}
        className="min-h-[52px] flex-1 rounded-[14px] border-[3px] border-stroke bg-panel px-3 font-bold text-ink shadow-[0_3px_0_rgb(0_0_0/0.35)] outline-none transition-colors placeholder:font-semibold placeholder:text-ink-muted/60 focus:border-mint focus:bg-panel-hi"
      />
      <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} disabled={!word.trim()} onClick={() => { dispatch({ type: "SOLVE", word }); setWord(""); setOpen(false); }}>OK</button>
    </div>
  );
}

function SetterInput({ dispatch, accent }: { dispatch: (a: unknown) => Promise<void>; accent: string }) {
  const t = useT();
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-[var(--color-ink-muted)]">{t("wisielec.setForOthers")}</p>
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("wisielec.categoryPlaceholder")} maxLength={40}
        className="min-h-[52px] rounded-[14px] border-[3px] border-stroke bg-panel px-3 font-bold text-ink shadow-[0_3px_0_rgb(0_0_0/0.35)] outline-none transition-colors placeholder:font-semibold placeholder:text-ink-muted/60 focus:border-mint focus:bg-panel-hi" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("wisielec.passwordPlaceholder")} maxLength={40} autoCapitalize="characters"
        className="min-h-[52px] rounded-[14px] border-[3px] border-stroke bg-panel px-3 font-bold text-ink shadow-[0_3px_0_rgb(0_0_0/0.35)] outline-none transition-colors placeholder:font-semibold placeholder:text-ink-muted/60 focus:border-mint focus:bg-panel-hi" />
      <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} disabled={!password.trim() || !category.trim()}
        onClick={() => dispatch({ type: "SET_PASSWORD", password, category })}>{t("wisielec.setPassword")}</button>
    </div>
  );
}

function ProgressBars({ pub, nickOf, accent }: { pub: Pub; nickOf: (u: string) => string; accent: string }) {
  const t = useT();
  return (
    <div className="w-full max-w-sm">
      <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">{t("wisielec.race")}</p>
      <ul className="flex flex-col gap-2">
        {pub.progress?.map((pr) => (
          <li key={pr.uid} className="flex items-center gap-2 text-sm">
            <span className="w-20 truncate">{nickOf(pr.uid)}</span>
            <span className="relative h-2 flex-1 overflow-hidden rounded bg-[var(--color-panel)]">
              <span className="absolute inset-y-0 left-0 rounded" style={{ width: `${pr.percent}%`, background: pr.solved ? "#4ade80" : accent }} />
            </span>
            <span className="tabular text-xs text-[var(--color-ink-muted)]">{pr.solved ? <Check size={14} strokeWidth={3} className="inline-block align-[-0.18em]" aria-hidden /> : <>{pr.wrong}<X size={14} strokeWidth={3} className="inline-block align-[-0.18em]" aria-hidden /></>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
