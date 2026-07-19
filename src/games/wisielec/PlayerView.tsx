"use client";
import { useEffect, useState } from "react";
import type { GameViewProps } from "@/games/view";
import { sfx, vibrate } from "@/lib/sound";
import { Hangman, MaskedWord, PolishKeyboard } from "./ui";
import { usePendingSet } from "@/games/useOptimistic";

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
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
  useTicker();
  const now = serverNow();

  const header = (
    <div className="text-center">
      <p className="text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">
        Runda {pub.round}{pub.totalRounds ? `/${pub.totalRounds}` : ""} · {pub.mode}
      </p>
      {pub.category && <p className="text-lg font-semibold" style={{ color: accent }}>Kategoria: {pub.category}</p>}
    </div>
  );

  // ---- USTAWIANIE (zadający) ----
  if (pub.phase === "ustawianie") {
    const priv = privateState as { amSetter?: boolean } | null;
    return (
      <div className="flex flex-col gap-5" style={{ ["--accent" as string]: accent }}>
        {header}
        {priv?.amSetter ? <SetterInput dispatch={dispatch} accent={accent} /> : (
          <p className="text-center text-[var(--color-tekst-drugi)]">
            {nickOf(pub.setterUid ?? "")} układa hasło… za chwilę zgadujecie.
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
          {pub.phase === "koniec" ? "Koniec gry 🏁" : won ? "Odgadnięte! 🎉" : "Wisielec zawisł 💀"}
        </p>
        {pub.winners.length > 0 && <p className="text-sm text-[var(--color-tekst-drugi)]">Wygrywają: {pub.winners.map(nickOf).join(", ")}</p>}
        <ul className="w-full max-w-sm">
          {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
            <li key={p.uid} className="flex justify-between px-2 py-1 text-sm">
              <span>{p.avatar} {p.nick}{p.uid === meUid && " (Ty)"}</span>
              <span className="tabular"><b>{p.score}</b>{p.roundDelta > 0 && <span className="ml-2" style={{ color: accent }}>+{p.roundDelta}</span>}</span>
            </li>
          ))}
        </ul>
        {isHost && pub.phase === "wynik" && (
          <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>Dalej →</button>
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
            {priv?.solved ? "Masz to! Czekaj na innych." : "Koniec żyć. Czekaj na koniec rundy."}
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
        <p className="text-center text-[var(--color-tekst-drugi)]">Ty ułożyłeś hasło — obserwuj, jak zgadują.</p>
      ) : myTurn ? (
        <>
          <p className="text-sm font-semibold" style={{ color: accent }}>Twoja tura {left != null ? `· ${left}s` : ""}</p>
          <GuessControls hits={pub.hits ?? []} misses={pub.misses ?? []} dispatch={dispatch} disabled={false} extraLetters={pub.extraLetters} accent={accent} resetKey={room.version} />
        </>
      ) : (
        <p className="text-center text-[var(--color-tekst-drugi)]">Tura: <b>{nickOf(pub.turnUid ?? "")}</b> {left != null ? `· ${left}s` : ""}</p>
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
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  if (!open) return <button className="btn" onClick={() => setOpen(true)}>Zgaduję całe hasło</button>;
  return (
    <div className="flex gap-2">
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        autoComplete="off"
        placeholder="całe hasło…"
        className="min-h-[52px] flex-1 rounded-xl border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] px-3 outline-none"
      />
      <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} disabled={!word.trim()} onClick={() => { dispatch({ type: "SOLVE", word }); setWord(""); setOpen(false); }}>OK</button>
    </div>
  );
}

function SetterInput({ dispatch, accent }: { dispatch: (a: unknown) => Promise<void>; accent: string }) {
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-[var(--color-tekst-drugi)]">Ułóż hasło dla pozostałych (oni tego nie widzą).</p>
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Kategoria / podpowiedź" maxLength={40}
        className="min-h-[52px] rounded-xl border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] px-3 outline-none" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Hasło" maxLength={40} autoCapitalize="characters"
        className="min-h-[52px] rounded-xl border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] px-3 outline-none" />
      <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} disabled={!password.trim() || !category.trim()}
        onClick={() => dispatch({ type: "SET_PASSWORD", password, category })}>Ustaw hasło</button>
    </div>
  );
}

function ProgressBars({ pub, nickOf, accent }: { pub: Pub; nickOf: (u: string) => string; accent: string }) {
  return (
    <div className="w-full max-w-sm">
      <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-tekst-drugi)]">Wyścig</p>
      <ul className="flex flex-col gap-2">
        {pub.progress?.map((pr) => (
          <li key={pr.uid} className="flex items-center gap-2 text-sm">
            <span className="w-20 truncate">{nickOf(pr.uid)}</span>
            <span className="relative h-2 flex-1 overflow-hidden rounded bg-[var(--color-powierzchnia)]">
              <span className="absolute inset-y-0 left-0 rounded" style={{ width: `${pr.percent}%`, background: pr.solved ? "#4ade80" : accent }} />
            </span>
            <span className="tabular text-xs text-[var(--color-tekst-drugi)]">{pr.solved ? "✓" : `${pr.wrong}✗`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
