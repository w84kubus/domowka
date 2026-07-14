"use client";
import type { GameHostViewProps } from "@/games/view";

interface PublicState {
  round: number;
  totalRounds: number;
  phase: "pomiar" | "odsloniecie" | "koniec";
  target: number;
  submitted: string[];
  players: { uid: string; nick: string; avatar: string; score: number }[];
  reveal: { uid: string; valueMs: number | null; signedMs: number | null; perfect: boolean; suspicious: boolean }[] | null;
}

const fmt = (ms: number) => (ms / 1000).toFixed(2).replace(".", ",") + " s";
const signed = (ms: number) => (ms > 0 ? "+" : ms < 0 ? "−" : "±") + (Math.abs(ms) / 1000).toFixed(2).replace(".", ",") + " s";

export function StoperHostView({ publicState, accent }: GameHostViewProps) {
  const pub = publicState as PublicState;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8" style={{ ["--accent" as string]: accent }}>
      <div className="text-center">
        <p className="text-lg uppercase tracking-[0.3em] text-[var(--color-tekst-drugi)]">
          Runda {pub.round}{pub.totalRounds ? ` / ${pub.totalRounds}` : ""}
        </p>
        <p className="tabular text-7xl font-bold" style={{ color: accent, textShadow: `0 0 30px ${accent}66` }}>
          {fmt(pub.target)}
        </p>
        <p className="text-[var(--color-tekst-drugi)]">cel</p>
      </div>

      {pub.phase === "pomiar" ? (
        <>
          <p className="text-2xl">{pub.submitted.length} / {pub.players.length} zatrzymało</p>
          <div className="flex flex-wrap justify-center gap-4">
            {pub.players.map((p) => (
              <div key={p.uid} className="card flex flex-col items-center gap-1 px-5 py-3" style={{ opacity: pub.submitted.includes(p.uid) ? 1 : 0.4 }}>
                <span className="text-3xl">{p.avatar}</span>
                <span className="text-sm">{p.nick}</span>
                <span className="text-xs" style={{ color: pub.submitted.includes(p.uid) ? accent : "var(--color-tekst-drugi)" }}>
                  {pub.submitted.includes(p.uid) ? "gotowe" : "mierzy…"}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="w-full max-w-2xl">
          <h2 className="mb-4 text-center text-2xl font-bold">{pub.phase === "koniec" ? "Wyniki końcowe" : "Odsłonięcie"}</h2>
          <ol className="flex flex-col gap-2">
            {(pub.reveal ?? []).map((r, i) => (
              <li key={r.uid} className="card flex items-center gap-4 px-5 py-3 text-lg"
                  style={r.perfect ? { borderColor: accent, boxShadow: `0 0 20px ${accent}55` } : undefined}>
                <span className="tabular w-8 text-center font-bold text-[var(--color-tekst-drugi)]">{i + 1}</span>
                <span className="flex-1">{nickOf(r.uid)}{r.suspicious && " ⚠"}{r.perfect && " 🎯"}</span>
                <span className="tabular text-right">
                  {r.valueMs == null ? "—" : <>{fmt(r.valueMs)} <span className="text-sm text-[var(--color-tekst-drugi)]">({signed(r.signedMs ?? 0)})</span></>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
