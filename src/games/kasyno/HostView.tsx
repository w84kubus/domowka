"use client";
import { useT } from "@/lib/i18n/provider";
import { AvatarIcon } from "@/components/AvatarIcon";
import { Podium } from "@/components/game/Podium";
import type { GameHostViewProps } from "@/games/view";

interface Pub {
  mode: string;
  phase: "zaklady" | "losowanie" | "wynik" | "koniec";
  round: number;
  pot: number;
  bets: { uid: string; amount: number; pick: string | null }[];
  outcome: { number?: number; colour?: string; multiplier?: number; winnerUid?: string } | null;
  history: string[];
  players: { uid: string; nick: string; avatar: string; chips: number; out: boolean }[];
}

const COLOUR_BG: Record<string, string> = { red: "#C0392B", black: "#1F2430", green: "#1E9E5A" };

// Ekran TV — wszyscy patrzą na jeden ekran, więc liczy się pula, wynik i salda.
export function KasynoHostView({ publicState }: GameHostViewProps) {
  const t = useT();
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";

  if (pub.phase === "koniec") {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <div className="scale-125">
          <Podium players={pub.players.map((p) => ({ ...p, score: p.chips }))} meUid="" />
        </div>
      </div>
    );
  }

  const wynik =
    pub.outcome?.colour ? t(`kasyno.${pub.outcome.colour}` as Parameters<typeof t>[0])
    : pub.outcome?.multiplier ? `×${pub.outcome.multiplier}`
    : pub.outcome?.winnerUid ? nickOf(pub.outcome.winnerUid)
    : null;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <span className="font-display text-xl font-bold uppercase tracking-[0.2em] text-ink-muted">
          {t("kasyno.pot")}
        </span>
        <span className="tabular font-display text-6xl font-bold text-bursztyn">{pub.pot}</span>
      </div>

      {wynik && pub.phase !== "zaklady" && (
        <div
          className="rounded-[20px] border-[6px] border-white px-10 py-4 shadow-[0_6px_0_rgb(0_0_0/0.35)]"
          style={{ background: pub.outcome?.colour ? COLOUR_BG[pub.outcome.colour] : "var(--color-panel-hi)" }}
        >
          <span className="font-display text-4xl font-bold uppercase text-white">{wynik}</span>
        </div>
      )}

      <ul className="grid w-full max-w-4xl grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {[...pub.players].sort((a, b) => b.chips - a.chips).map((p) => (
          <li
            key={p.uid}
            className={`flex items-center gap-3 rounded-[20px] border-[3px] border-stroke bg-panel px-3 py-2 ${p.out ? "opacity-40" : ""}`}
          >
            <AvatarIcon avatar={p.avatar} size={38} />
            <span className="min-w-0 flex-1 truncate font-display text-lg font-bold text-ink">{p.nick}</span>
            <span className="tabular font-display text-lg font-bold text-bursztyn">{p.chips}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
