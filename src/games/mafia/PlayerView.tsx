"use client";
import { useEffect, useState } from "react";
import type { GameViewProps } from "@/games/view";
import type { Role } from "./engine";
import { useSent } from "@/games/useOptimistic";

interface PlayerV { uid: string; nick: string; avatar: string; alive: boolean; confirmed: boolean; voted: boolean; role: Role | null; score: number }
interface Pub {
  phase: "rozdanie" | "noc" | "switt" | "dzien" | "glosowanie" | "koniec";
  night: number; narrator: string; deaths: string[]; winner: "miasto" | "mafia" | null; afterReveal: string;
  players: PlayerV[]; votesTally: Record<string, number>; aliveCount: number;
}
interface Priv { role?: Role; alive?: boolean; mafia?: string[]; mafiaVotes?: Record<string, string>; checks?: { target: string; isMafia: boolean }[]; acted?: boolean }

const ROLE_INFO: Record<Role, { emoji: string; name: string; desc: string }> = {
  mafia: { emoji: "🔪", name: "Mafia", desc: "W nocy wybieracie ofiarę. Za dnia udawaj niewinnego." },
  mieszkaniec: { emoji: "🏠", name: "Mieszkaniec", desc: "Nie masz zdolności. Znajdź mafię rozmową i głosem." },
  detektyw: { emoji: "🔍", name: "Detektyw", desc: "Co noc sprawdzasz jedną osobę: mafia czy nie." },
  lekarz: { emoji: "🩺", name: "Lekarz", desc: "Co noc chronisz jedną osobę przed śmiercią." },
};

function useTicker(ms = 400) { const [, s] = useState(0); useEffect(() => { const id = setInterval(() => s((n) => n + 1), ms); return () => clearInterval(id); }, [ms]); }
const secLeft = (e: number | null, now: number) => (e == null ? null : Math.max(0, Math.ceil((e - now) / 1000)));

export function MafiaPlayerView({ room, publicState, privateState, meUid, isHost, dispatch, serverNow, accent }: GameViewProps) {
  const pub = publicState as Pub;
  const priv = privateState as Priv | null;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
  useTicker();
  const left = secLeft(room.phaseEndsAt, serverNow());
  const me = pub.players.find((p) => p.uid === meUid);
  const iAmAlive = me?.alive ?? true;
  const [sent, markSent] = useSent(room.version); // natychmiastowy feedback na akcję/głos

  const narrator = <p className="text-center text-sm italic text-[var(--color-tekst-drugi)]">{pub.narrator}</p>;

  // —— ROZDANIE ——
  if (pub.phase === "rozdanie") {
    return (
      <div className="flex flex-col items-center gap-5" style={{ ["--accent" as string]: accent }}>
        {narrator}
        <RoleCard priv={priv} nickOf={nickOf} accent={accent} />
        {me?.confirmed || sent
          ? <p className="text-[var(--color-tekst-drugi)]">Czekamy… ({pub.players.filter((p) => p.confirmed).length}/{pub.players.length})</p>
          : <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => { markSent(); dispatch({ type: "CONFIRM" }); }}>Zapamiętałem</button>}
      </div>
    );
  }

  // —— KONIEC ——
  if (pub.phase === "koniec") {
    return (
      <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
        <p className="text-3xl font-bold" style={{ color: pub.winner === "mafia" ? accent : "#4ade80" }}>
          {pub.winner === "mafia" ? "Mafia wygrywa! 🔪" : "Miasto wygrywa! 🎉"}
        </p>
        {narrator}
        <RoleReveal pub={pub} meUid={meUid} accent={accent} />
      </div>
    );
  }

  // —— ŚWIT ——
  if (pub.phase === "switt") {
    return (
      <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
        {narrator}
        {pub.deaths.length ? pub.deaths.map((d) => (
          <p key={d} className="text-xl font-bold">💀 {nickOf(d)}{pub.players.find((p) => p.uid === d)?.role ? ` — ${ROLE_INFO[pub.players.find((p) => p.uid === d)!.role!].name}` : ""}</p>
        )) : <p className="text-lg text-[var(--color-tekst-drugi)]">Nikt nie zginął tej nocy.</p>}
        <AliveList pub={pub} meUid={meUid} />
        {isHost && <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>Dalej →</button>}
      </div>
    );
  }

  // —— NOC ——
  if (pub.phase === "noc") {
    if (!iAmAlive) return <div className="flex flex-col items-center gap-3">{narrator}<p className="text-[var(--color-tekst-drugi)]">Nie żyjesz — obserwujesz z zaświatów.</p></div>;
    const role = priv?.role;
    const acted = priv?.acted;
    const targets = pub.players.filter((p) => p.alive);
    return (
      <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
        <p className="text-center text-2xl">🌙 Noc {pub.night}</p>
        {narrator}
        {role === "mieszkaniec" && <p className="text-center text-[var(--color-tekst-drugi)]">Śpisz spokojnie. Miasto działa bez Ciebie.</p>}
        {role && role !== "mieszkaniec" && (
          acted || sent ? (
            <p className="text-center" style={{ color: accent }}>
              Wybór zapisany. Czekaj na świt… {left != null ? `(${left}s)` : ""}
              {role === "detektyw" && priv?.checks && priv.checks.length > 0 && (
                <span className="mt-2 block text-sm text-[var(--color-tekst-drugi)]">
                  Ostatni wynik: {nickOf(priv.checks[priv.checks.length - 1].target)} — {priv.checks[priv.checks.length - 1].isMafia ? "MAFIA 🔪" : "czysty ✓"}
                </span>
              )}
            </p>
          ) : (
            <>
              <p className="text-center font-semibold">
                {role === "mafia" ? "Kogo mafia dziś sprząta?" : role === "detektyw" ? "Kogo sprawdzasz?" : "Kogo chronisz?"}
                {left != null ? ` · ${left}s` : ""}
              </p>
              <div className="grid w-full grid-cols-2 gap-2">
                {targets.map((p) => {
                  const blocked = role === "mafia" && priv?.mafia?.includes(p.uid);
                  if (blocked) return null;
                  const type = role === "mafia" ? "MAFIA_KILL" : role === "detektyw" ? "INVESTIGATE" : "PROTECT";
                  const mafiaVoteCount = role === "mafia" && priv?.mafiaVotes ? Object.values(priv.mafiaVotes).filter((t) => t === p.uid).length : 0;
                  return (
                    <button key={p.uid} className="btn" onClick={() => { markSent(); dispatch({ type, target: p.uid }); }}>
                      {p.avatar} {p.nick}{mafiaVoteCount > 0 ? ` (${mafiaVoteCount})` : ""}
                    </button>
                  );
                })}
              </div>
              {role === "mafia" && priv?.mafia && priv.mafia.length > 1 && (
                <p className="text-xs text-[var(--color-tekst-drugi)]">Twoja mafia: {priv.mafia.filter((u) => u !== meUid).map(nickOf).join(", ")}</p>
              )}
            </>
          )
        )}
      </div>
    );
  }

  // —— DZIEŃ ——
  if (pub.phase === "dzien") {
    return (
      <div className="flex flex-col items-center gap-4" style={{ ["--accent" as string]: accent }}>
        <p className="text-2xl">☀️ Dzień {pub.night}</p>
        {narrator}
        <p className="text-[var(--color-tekst-drugi)]">Rozmawiajcie na żywo. {left != null ? `Zostało ${left}s.` : ""}</p>
        <AliveList pub={pub} meUid={meUid} />
        {isHost && <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>Do głosowania →</button>}
      </div>
    );
  }

  // —— GŁOSOWANIE ——
  return (
    <div className="flex flex-col gap-3" style={{ ["--accent" as string]: accent }}>
      <p className="text-center text-xl">🗳️ Głosowanie {left != null ? `· ${left}s` : ""}</p>
      {narrator}
      {!iAmAlive ? <p className="text-center text-[var(--color-tekst-drugi)]">Martwi nie głosują.</p> : me?.voted || sent ? (
        <p className="text-center text-[var(--color-tekst-drugi)]">Zagłosowano. Czekamy…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {pub.players.filter((p) => p.alive && p.uid !== meUid).map((p) => (
            <button key={p.uid} className="btn" onClick={() => { markSent(); dispatch({ type: "VOTE", target: p.uid }); }}>
              {p.avatar} {p.nick}{pub.votesTally[p.uid] ? ` (${pub.votesTally[p.uid]})` : ""}
            </button>
          ))}
          <button className="btn col-span-2" onClick={() => { markSent(); dispatch({ type: "VOTE", target: "nikt" }); }}>Nikt</button>
        </div>
      )}
    </div>
  );
}

function RoleCard({ priv, nickOf, accent }: { priv: Priv | null; nickOf: (u: string) => string; accent: string }) {
  const [show, setShow] = useState(false);
  const role = priv?.role;
  const info = role ? ROLE_INFO[role] : null;
  return (
    <button onPointerDown={() => setShow(true)} onPointerUp={() => setShow(false)} onPointerLeave={() => setShow(false)}
      className="flex h-60 w-full max-w-xs select-none flex-col items-center justify-center gap-2 rounded-3xl border-2 p-4 text-center"
      style={{ borderColor: accent, background: "var(--color-powierzchnia)" }}>
      {show && info ? (
        <>
          <span className="text-6xl">{info.emoji}</span>
          <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: role === "mafia" ? accent : "var(--color-tekst)" }}>{info.name}</span>
          <span className="text-sm text-[var(--color-tekst-drugi)]">{info.desc}</span>
          {role === "mafia" && priv?.mafia && priv.mafia.length > 1 && (
            <span className="text-sm">Twoja mafia: {priv.mafia.map(nickOf).join(", ")}</span>
          )}
        </>
      ) : (
        <><span className="text-5xl">🃏</span><span className="text-[var(--color-tekst-drugi)]">Przytrzymaj palec, żeby zobaczyć rolę</span></>
      )}
    </button>
  );
}

function AliveList({ pub, meUid }: { pub: Pub; meUid: string }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {pub.players.map((p) => (
        <span key={p.uid} className="rounded-lg px-2 py-1 text-sm" style={{ background: "var(--color-powierzchnia)", opacity: p.alive ? 1 : 0.4 }}>
          {p.alive ? p.avatar : "💀"} {p.nick}{p.uid === meUid && " (Ty)"}
        </span>
      ))}
    </div>
  );
}

function RoleReveal({ pub, meUid, accent }: { pub: Pub; meUid: string; accent: string }) {
  return (
    <ul className="w-full max-w-sm">
      {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
        <li key={p.uid} className="flex items-center justify-between px-2 py-1 text-sm">
          <span>{p.avatar} {p.nick}{p.uid === meUid && " (Ty)"} — <b style={{ color: p.role === "mafia" ? accent : undefined }}>{p.role ? ROLE_INFO[p.role].name : "?"}</b></span>
          <span className="tabular font-bold">{p.score}</span>
        </li>
      ))}
    </ul>
  );
}
