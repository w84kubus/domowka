"use client";
import { useEffect, useState } from "react";
import type { GameViewProps } from "@/games/view";

interface Pub {
  round: number; totalRounds: number;
  phase: "rozdanie" | "podpowiedzi" | "dyskusja" | "glosowanie" | "zgadywanie" | "wynik" | "koniec";
  speakMode: "na_glos" | "tekstowy"; clueRound: number; totalClueRounds: number;
  speakingOrder: string[]; currentSpeaker: string | null;
  clues: { uid: string; round: number; word: string }[]; cluesThisRound: string[];
  ejected: string | null; votesTally: Record<string, number>; result: string; byGuess: boolean;
  players: { uid: string; nick: string; avatar: string; score: number; roundDelta: number; confirmed: boolean; voted: boolean }[];
  word: string | null; impostors: string[]; category: string | null;
}
interface Priv { role?: "impostor" | "cywil"; word?: string | null; hint?: string | null; hintType?: string; coImpostors?: string[] }

function useTicker(ms = 400) {
  const [, s] = useState(0);
  useEffect(() => { const id = setInterval(() => s((n) => n + 1), ms); return () => clearInterval(id); }, [ms]);
}
const secLeft = (e: number | null, now: number) => (e == null ? null : Math.max(0, Math.ceil((e - now) / 1000)));

export function ImpostorPlayerView({ room, publicState, privateState, meUid, isHost, dispatch, serverNow, accent }: GameViewProps) {
  const pub = publicState as Pub;
  const priv = privateState as Priv | null;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
  useTicker();
  const now = serverNow();
  const left = secLeft(room.phaseEndsAt, now);
  const me = pub.players.find((p) => p.uid === meUid);

  const header = (
    <p className="text-center text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">
      Runda {pub.round}{pub.totalRounds ? `/${pub.totalRounds}` : ""}
    </p>
  );

  // ---- ROZDANIE: karta press-and-hold ----
  if (pub.phase === "rozdanie") {
    return (
      <div className="flex flex-col items-center gap-5" style={{ ["--accent" as string]: accent }}>
        {header}
        <RoleCard priv={priv} accent={accent} />
        {me?.confirmed ? (
          <p className="text-[var(--color-tekst-drugi)]">Czekamy na resztę… ({pub.players.filter((p) => p.confirmed).length}/{pub.players.length})</p>
        ) : (
          <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "CONFIRM" })}>Zapamiętałem</button>
        )}
      </div>
    );
  }

  // ---- WYNIK / KONIEC ----
  if (pub.phase === "wynik" || pub.phase === "koniec") {
    const civWin = pub.result === "cywile";
    return (
      <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
        {header}
        <p className="text-2xl font-bold" style={{ color: civWin ? "#4ade80" : accent }}>
          {pub.phase === "koniec" ? "Koniec gry 🏁" : civWin ? "Cywile wygrywają!" : pub.byGuess ? "Impostor odgadł hasło!" : "Impostorzy wygrywają!"}
        </p>
        <p>Hasło: <b>{pub.word}</b> {pub.category && <span className="text-[var(--color-tekst-drugi)]">({pub.category})</span>}</p>
        <p className="text-sm text-[var(--color-tekst-drugi)]">Impostorzy: {pub.impostors.map(nickOf).join(", ")}</p>
        <ScoreList pub={pub} meUid={meUid} accent={accent} />
        {isHost && pub.phase === "wynik" && (
          <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>Dalej →</button>
        )}
      </div>
    );
  }

  // ---- ZGADYWANIE (impostor po wylocie) ----
  if (pub.phase === "zgadywanie") {
    const amEjected = pub.ejected === meUid;
    return (
      <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
        {header}
        {amEjected ? (
          <>
            <p className="text-center">Wyleciałeś! Odgadnij hasło ({left ?? 0}s):</p>
            <GuessBox dispatch={dispatch} accent={accent} />
          </>
        ) : (
          <p className="text-center text-[var(--color-tekst-drugi)]">{nickOf(pub.ejected ?? "")} był impostorem i zgaduje hasło… ({left ?? 0}s)</p>
        )}
      </div>
    );
  }

  // ---- GŁOSOWANIE ----
  if (pub.phase === "glosowanie") {
    return (
      <div className="flex flex-col gap-3" style={{ ["--accent" as string]: accent }}>
        {header}
        <p className="text-center font-semibold" style={{ color: accent }}>Kto jest impostorem? {left != null ? `· ${left}s` : ""}</p>
        <div className="grid grid-cols-2 gap-2">
          {pub.players.filter((p) => p.uid !== meUid).map((p) => (
            <button key={p.uid} disabled={me?.voted} onClick={() => dispatch({ type: "VOTE", targetUid: p.uid })}
              className="btn disabled:opacity-50">{p.avatar} {p.nick}{pub.votesTally[p.uid] ? ` (${pub.votesTally[p.uid]})` : ""}</button>
          ))}
        </div>
        {me?.voted && <p className="text-center text-sm text-[var(--color-tekst-drugi)]">Zagłosowano. Czekamy…</p>}
      </div>
    );
  }

  // ---- PODPOWIEDZI / DYSKUSJA ----
  const myClueGiven = pub.cluesThisRound.includes(meUid);
  const amSpeaker = pub.currentSpeaker === meUid;
  return (
    <div className="flex flex-col gap-4" style={{ ["--accent" as string]: accent }}>
      {header}
      <RoleReminder priv={priv} accent={accent} />

      {pub.phase === "podpowiedzi" && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-[var(--color-tekst-drugi)]">
            Podpowiedzi {pub.clueRound}/{pub.totalClueRounds} · {pub.speakMode === "tekstowy" ? "wpisz jedno słowo" : "mówcie po kolei"}
          </p>
          {pub.speakMode === "tekstowy" ? (
            myClueGiven ? <p className="text-center text-[var(--color-tekst-drugi)]">Podano. Czekamy na innych…</p>
              : <ClueBox dispatch={dispatch} accent={accent} />
          ) : (
            <p className="text-center text-lg">{amSpeaker ? "Twoja kolej — powiedz słowo!" : <>Teraz: <b>{nickOf(pub.currentSpeaker ?? "")}</b></>}</p>
          )}
          {pub.speakMode === "na_glos" && (amSpeaker || isHost) && (
            <button className="btn" onClick={() => dispatch({ type: "NEXT_SPEAKER" })}>Następny mówca →</button>
          )}
        </div>
      )}

      {pub.phase === "dyskusja" && (
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: accent }}>Dyskusja! {left != null ? `· ${left}s` : ""}</p>
          {isHost && <button className="btn btn-accent mt-3" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>Do głosowania →</button>}
        </div>
      )}

      {pub.speakMode === "tekstowy" && pub.clues.length > 0 && (
        <div className="card p-3">
          <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-tekst-drugi)]">Słowa</p>
          <ul className="flex flex-col gap-1 text-sm">
            {pub.clues.map((c, i) => <li key={i} className="flex justify-between"><span className="text-[var(--color-tekst-drugi)]">{nickOf(c.uid)}</span><span className="font-semibold">{c.word}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function RoleCard({ priv, accent }: { priv: Priv | null; accent: string }) {
  const [show, setShow] = useState(false);
  const isImp = priv?.role === "impostor";
  return (
    <button
      onPointerDown={() => setShow(true)}
      onPointerUp={() => setShow(false)}
      onPointerLeave={() => setShow(false)}
      className="flex h-56 w-full max-w-xs select-none flex-col items-center justify-center gap-2 rounded-3xl border-2 text-center"
      style={{ borderColor: accent, background: "var(--color-powierzchnia)" }}
    >
      {show ? (
        isImp ? (
          <>
            <span className="text-3xl font-bold" style={{ color: accent, fontFamily: "var(--font-display)" }}>IMPOSTOR</span>
            {priv?.hint && <span className="text-lg">Podpowiedź: <b>{priv.hint}</b></span>}
            {priv?.coImpostors && priv.coImpostors.length > 0 && <span className="text-sm text-[var(--color-tekst-drugi)]">Twoi: {priv.coImpostors.join(", ")}</span>}
            <span className="text-xs text-[var(--color-tekst-drugi)]">Udawaj, że znasz hasło.</span>
          </>
        ) : (
          <>
            <span className="text-sm text-[var(--color-tekst-drugi)]">Twoje hasło:</span>
            <span className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{priv?.word}</span>
          </>
        )
      ) : (
        <>
          <span className="text-5xl">🤫</span>
          <span className="text-[var(--color-tekst-drugi)]">Przytrzymaj palec, żeby zobaczyć</span>
        </>
      )}
    </button>
  );
}

function RoleReminder({ priv, accent }: { priv: Priv | null; accent: string }) {
  const [show, setShow] = useState(false);
  return (
    <button onPointerDown={() => setShow(true)} onPointerUp={() => setShow(false)} onPointerLeave={() => setShow(false)}
      className="mx-auto rounded-full border px-4 py-1 text-sm" style={{ borderColor: accent }}>
      {show ? (priv?.role === "impostor" ? `IMPOSTOR${priv?.hint ? ` · ${priv.hint}` : ""}` : `Hasło: ${priv?.word}`) : "Przytrzymaj: twoja rola 🤫"}
    </button>
  );
}

function ClueBox({ dispatch, accent }: { dispatch: (a: unknown) => Promise<void>; accent: string }) {
  const [word, setWord] = useState("");
  return (
    <div className="flex gap-2">
      <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={30} autoComplete="off" placeholder="jedno słowo…"
        className="min-h-[52px] flex-1 rounded-xl border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] px-3 outline-none" />
      <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} disabled={!word.trim()} onClick={() => dispatch({ type: "CLUE", word })}>Podaj</button>
    </div>
  );
}
function GuessBox({ dispatch, accent }: { dispatch: (a: unknown) => Promise<void>; accent: string }) {
  const [word, setWord] = useState("");
  return (
    <div className="flex gap-2">
      <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={40} autoComplete="off" placeholder="hasło…"
        className="min-h-[52px] flex-1 rounded-xl border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] px-3 outline-none" />
      <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} disabled={!word.trim()} onClick={() => dispatch({ type: "GUESS_WORD", word })}>Zgaduję</button>
    </div>
  );
}
function ScoreList({ pub, meUid, accent }: { pub: Pub; meUid: string; accent: string }) {
  return (
    <ul className="w-full max-w-sm">
      {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
        <li key={p.uid} className="flex justify-between px-2 py-1 text-sm">
          <span>{p.avatar} {p.nick}{p.uid === meUid && " (Ty)"}{pub.impostors.includes(p.uid) && " 🕵️"}</span>
          <span className="tabular"><b>{p.score}</b>{p.roundDelta > 0 && <span className="ml-2" style={{ color: accent }}>+{p.roundDelta}</span>}</span>
        </li>
      ))}
    </ul>
  );
}
