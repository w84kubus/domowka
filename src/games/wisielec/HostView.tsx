"use client";
import { Skull, X } from "lucide-react";
import type { GameHostViewProps } from "@/games/view";
import { Hangman, MaskedWord } from "./ui";
import { AvatarIcon } from "@/components/AvatarIcon";

type Cell = { ch: string | null; kind: "letter" | "space" | "punct" };
interface Pub {
  mode: "zadajacy" | "wyscig" | "kooperacja";
  round: number;
  totalRounds: number;
  phase: string;
  category: string;
  maxWrong: number;
  result: string;
  winners: string[];
  players: { uid: string; nick: string; avatar: string; score: number }[];
  mask?: Cell[] | null;
  wrong?: number;
  turnUid?: string | null;
  progress?: { uid: string; percent: number; wrong: number; solved: boolean }[];
}

export function WisielecHostView({ publicState, accent }: GameHostViewProps) {
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6" style={{ ["--accent" as string]: accent }}>
      <p className="text-lg uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">
        Runda {pub.round}{pub.totalRounds ? `/${pub.totalRounds}` : ""} · {pub.category}
      </p>

      {pub.mode === "wyscig" ? (
        <div className="w-full max-w-2xl">
          <ul className="flex flex-col gap-3">
            {pub.progress?.map((pr) => (
              <li key={pr.uid} className="flex items-center gap-3 text-xl">
                <span className="w-40 truncate">{nickOf(pr.uid)}</span>
                <span className="relative h-4 flex-1 overflow-hidden rounded-full bg-[var(--color-panel)]">
                  <span className="absolute inset-y-0 left-0" style={{ width: `${pr.percent}%`, background: pr.solved ? "#4ade80" : accent }} />
                </span>
                <span className="tabular w-16 text-right text-base text-[var(--color-ink-muted)]">{pr.solved ? "META" : <>{pr.wrong}<X size={14} strokeWidth={3} className="inline-block align-[-0.18em]" aria-hidden /></>}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <Hangman wrong={pub.wrong ?? 0} maxWrong={pub.maxWrong} size={260} />
          {pub.mask && <MaskedWord mask={pub.mask} accent={accent} big />}
          {pub.phase === "zgadywanie" && pub.turnUid && (
            <p className="text-2xl">Tura: <b style={{ color: accent }}>{nickOf(pub.turnUid)}</b></p>
          )}
        </>
      )}

      {(pub.phase === "wynik" || pub.phase === "koniec") && (
        <p className="text-3xl font-bold" style={{ color: pub.result === "wygrana" ? "#4ade80" : "var(--color-czerwien)" }}>
          {pub.result === "wygrana" ? `Wygrywają: ${pub.winners.map(nickOf).join(", ")}` : <>Wisielec zawisł <Skull size={22} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /></>}
        </p>
      )}

      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
          <div key={p.uid} className="flex items-center gap-2 text-lg">
            <AvatarIcon avatar={p.avatar} size={26} />
            <span>{p.nick}</span>
            <span className="tabular font-bold" style={{ color: accent }}>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
