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
        <p className="font-display text-lg font-bold uppercase tracking-[0.3em] text-mint">
          Runda {pub.round}{pub.totalRounds ? ` / ${pub.totalRounds}` : ""}
        </p>
        <p className="tabular text-7xl font-bold" style={{ color: accent, textShadow: `0 0 30px ${accent}66` }}>
          {fmt(pub.target)}
        </p>
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-muted">cel</p>
      </div>

      {pub.phase === "pomiar" ? (
        <>
          <p className="font-display text-3xl font-bold uppercase text-ink">
            {pub.submitted.length} / {pub.players.length} zatrzymało
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {pub.players.map((p) => {
              const done = pub.submitted.includes(p.uid);
              return (
                <div
                  key={p.uid}
                  className="flex flex-col items-center gap-2 rounded-[20px] border-[3px] bg-panel px-6 py-4 shadow-[0_4px_0_rgb(0_0_0/0.35)]"
                  style={{ borderColor: done ? accent : "var(--color-stroke)" }}
                >
                  <span className="flex size-16 items-center justify-center rounded-full border-4 border-white bg-panel-hi text-4xl">
                    {p.avatar}
                  </span>
                  <span className="text-lg font-bold text-ink">{p.nick}</span>
                  <span
                    className="font-display text-sm font-bold uppercase tracking-[0.06em]"
                    style={{ color: done ? accent : "var(--color-ink-muted)" }}
                  >
                    {done ? "gotowe" : "mierzy…"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="w-full max-w-2xl">
          <h2 className="font-display mb-4 text-center text-3xl font-bold uppercase tracking-wide text-ink">
            {pub.phase === "koniec" ? "Wyniki końcowe" : "Odsłonięcie"}
          </h2>
          <ol className="flex flex-col gap-2">
            {(pub.reveal ?? []).map((r, i) => (
              <li
                key={r.uid}
                className="flex items-center gap-4 rounded-[14px] border-[3px] border-stroke bg-panel px-5 py-3 text-xl shadow-[0_3px_0_rgb(0_0_0/0.35)]"
                style={r.perfect ? { borderColor: accent, boxShadow: `0 3px 0 ${accent}` } : undefined}
              >
                <span className="tabular w-8 text-center font-bold text-ink-muted">{i + 1}</span>
                <span className="flex-1 font-bold text-ink">
                  {nickOf(r.uid)}{r.suspicious && " ⚠"}{r.perfect && " 🎯"}
                </span>
                <span className="tabular text-right font-bold">
                  {r.valueMs == null ? "—" : <>{fmt(r.valueMs)} <span className="text-base font-semibold text-ink-muted">({signed(r.signedMs ?? 0)})</span></>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
