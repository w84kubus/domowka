"use client";
import type { GameHostViewProps } from "@/games/view";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarIcon } from "@/components/AvatarIcon";
import { Plansza, Znak, type Pole } from "./ui";

interface Pub {
  phase: "gra" | "wynik" | "koniec";
  round: number; totalRounds: number;
  plansza: Pole[]; para: [string, string]; turaUid: string | null;
  ostatnia: { zwyciezca: string | null; linia: readonly number[] | null } | null;
  players: { uid: string; nick: string; avatar: string; score: number; gra: boolean }[];
}

// Ekran TV: plansza duża na tyle, żeby było widać z kanapy. Reszta pokoju patrzy
// tutaj, więc nazwiska grającej pary są równie ważne co same pola.
export function KolkoHostView({ publicState, accent }: GameHostViewProps) {
  const { t } = useI18n();
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6" style={{ ["--accent" as string]: accent }}>
      <p className="text-lg uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">
        {t("kolko.round", { round: pub.round })}{pub.totalRounds ? ` / ${pub.totalRounds}` : ""}
      </p>

      <p className="flex items-center gap-4 text-3xl font-bold">
        <span className="inline-flex items-center gap-2"><Znak znak={0} size={28} accent={accent} /> {nickOf(pub.para[0])}</span>
        <span className="text-[var(--color-ink-muted)]">vs</span>
        <span className="inline-flex items-center gap-2"><Znak znak={1} size={28} accent={accent} /> {nickOf(pub.para[1])}</span>
      </p>

      <Plansza plansza={pub.plansza} linia={pub.ostatnia?.linia} rozmiar={130} accent={accent} />

      {pub.phase === "gra" ? (
        <p className="text-2xl" style={{ color: accent }}>{t("kolko.nowPlaying", { nick: nickOf(pub.turaUid ?? "") })}</p>
      ) : (
        <p className="text-3xl font-bold" style={{ color: accent }}>
          {pub.ostatnia?.zwyciezca ? t("kolko.winner", { nick: nickOf(pub.ostatnia.zwyciezca) }) : t("kolko.draw")}
        </p>
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
