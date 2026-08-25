"use client";
import type { GameHostViewProps } from "@/games/view";
import { useT } from "@/lib/i18n/provider";
import { AvatarIcon } from "@/components/AvatarIcon";

interface Pub {
  round: number; totalRounds: number; phase: string;
  speakMode: string; speakingOrder: string[]; currentSpeaker: string | null; clueRound: number; totalClueRounds: number;
  clues: { uid: string; word: string }[]; votesTally: Record<string, number>; ejected: string | null;
  result: string; byGuess: boolean;
  players: { uid: string; nick: string; avatar: string; score: number; confirmed: boolean }[];
  word: string | null; impostors: string[]; category: string | null;
}

export function ImpostorHostView({ publicState, accent }: GameHostViewProps) {
  const t = useT();
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6" style={{ ["--accent" as string]: accent }}>
      <p className="text-lg uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">
        {t("common.round")} {pub.round}{pub.totalRounds ? `/${pub.totalRounds}` : ""} · {pub.phase}
      </p>

      {pub.phase === "rozdanie" && (
        <p className="text-2xl">Wszyscy sprawdzają swoje karty… ({pub.players.filter((p) => p.confirmed).length}/{pub.players.length})</p>
      )}

      {pub.phase === "podpowiedzi" && (
        <div className="text-center">
          <p className="mb-3 text-xl">Kolejność: {pub.speakingOrder.map(nickOf).join(" → ")}</p>
          {pub.speakMode === "na_glos" && pub.currentSpeaker && <p className="text-3xl font-bold" style={{ color: accent }}>Mówi: {nickOf(pub.currentSpeaker)}</p>}
        </div>
      )}

      {pub.speakMode === "tekstowy" && pub.clues.length > 0 && (pub.phase === "podpowiedzi" || pub.phase === "dyskusja") && (
        <div className="flex flex-wrap justify-center gap-3">
          {pub.clues.map((c, i) => (
            <div key={i} className="card px-4 py-2 text-center">
              <div className="text-xs text-[var(--color-ink-muted)]">{nickOf(c.uid)}</div>
              <div className="text-lg font-semibold">{c.word}</div>
            </div>
          ))}
        </div>
      )}

      {pub.phase === "dyskusja" && <p className="text-4xl font-bold" style={{ color: accent }}>{t("impostor.discussion")}</p>}

      {pub.phase === "glosowanie" && (
        <div className="w-full max-w-md">
          <p className="mb-3 text-center text-2xl">{t("impostor.voting")}</p>
          <ul className="flex flex-col gap-2">
            {pub.players.map((p) => (
              <li key={p.uid} className="flex items-center justify-between text-lg">
                <span><AvatarIcon avatar={p.avatar} size={18} /> {p.nick}</span>
                <span className="tabular" style={{ color: accent }}>{"●".repeat(pub.votesTally[p.uid] ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(pub.phase === "wynik" || pub.phase === "koniec") && (
        <div className="text-center">
          <p className="text-4xl font-bold" style={{ color: pub.result === "cywile" ? "#4ade80" : accent }}>
            {pub.result === "cywile" ? t("impostor.civiliansWin") : pub.byGuess ? t("impostor.guessedWord") : t("impostor.impostorsWin")}
          </p>
          <p className="mt-3 text-2xl">{t("impostor.password")} <b>{pub.word}</b> <span className="text-[var(--color-ink-muted)]">({pub.category})</span></p>
          <p className="text-lg text-[var(--color-ink-muted)]">{t("impostor.impostorsWere", { nicks: pub.impostors.map(nickOf).join(", ") })}</p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
          <div key={p.uid} className="flex items-center gap-2 text-lg">
            <AvatarIcon avatar={p.avatar} size={26} /><span>{p.nick}</span>
            <span className="tabular font-bold" style={{ color: accent }}>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
