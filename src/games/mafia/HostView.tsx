"use client";
import type { GameHostViewProps } from "@/games/view";
import type { Role } from "./engine";

interface PlayerV { uid: string; nick: string; avatar: string; alive: boolean; voted: boolean; role: Role | null; score: number }
interface Pub {
  phase: string; night: number; narrator: string; deaths: string[]; winner: "miasto" | "mafia" | null;
  players: PlayerV[]; votesTally: Record<string, number>; aliveCount: number;
}
const ROLE_NAME: Record<Role, string> = { mafia: "Mafia", mieszkaniec: "Mieszkaniec", detektyw: "Detektyw", lekarz: "Lekarz" };

export function MafiaHostView({ publicState, accent }: GameHostViewProps) {
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
  const night = pub.phase === "noc" || (pub.phase === "switt" && pub.narrator);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6" style={{ ["--accent" as string]: accent, filter: night ? "brightness(0.85)" : undefined }}>
      <p className="text-2xl">
        {pub.phase === "noc" ? `🌙 Noc ${pub.night}` : pub.phase === "dzien" ? `☀️ Dzień ${pub.night}` :
         pub.phase === "glosowanie" ? "🗳️ Głosowanie" : pub.phase === "switt" ? "🌅 Świt" :
         pub.phase === "koniec" ? "🏁 Koniec" : "🃏 Rozdanie"}
      </p>
      <p className="max-w-2xl text-center text-xl italic text-[var(--color-ink-muted)]">{pub.narrator}</p>

      {pub.phase === "switt" && (
        <div className="text-center">
          {pub.deaths.length ? pub.deaths.map((d) => (
            <p key={d} className="text-3xl font-bold">💀 {nickOf(d)}{pub.players.find((p) => p.uid === d)?.role ? ` — ${ROLE_NAME[pub.players.find((p) => p.uid === d)!.role!]}` : ""}</p>
          )) : <p className="text-2xl text-[var(--color-ink-muted)]">Noc minęła spokojnie.</p>}
        </div>
      )}

      {pub.phase === "koniec" ? (
        <>
          <p className="text-4xl font-bold" style={{ color: pub.winner === "mafia" ? accent : "#4ade80" }}>
            {pub.winner === "mafia" ? "Mafia wygrywa!" : "Miasto wygrywa!"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {pub.players.map((p) => (
              <div key={p.uid} className="card px-4 py-2 text-center">
                <div className="text-2xl">{p.avatar}</div><div>{p.nick}</div>
                <div className="text-sm" style={{ color: p.role === "mafia" ? accent : "var(--color-ink-muted)" }}>{p.role ? ROLE_NAME[p.role] : "?"}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {pub.players.map((p) => (
            <div key={p.uid} className="card flex flex-col items-center px-4 py-2" style={{ opacity: p.alive ? 1 : 0.35 }}>
              <span className="text-3xl">{p.alive ? p.avatar : "💀"}</span>
              <span>{p.nick}</span>
              {pub.phase === "glosowanie" && <span className="tabular text-sm" style={{ color: accent }}>{"●".repeat(pub.votesTally[p.uid] ?? 0)}</span>}
            </div>
          ))}
        </div>
      )}

      <p className="text-[var(--color-ink-muted)]">Żywych: {pub.aliveCount}</p>
    </div>
  );
}
