"use client";
import { Medal } from "lucide-react";
import { AvatarIcon } from "@/components/AvatarIcon";
import { Illustration } from "@/components/Illustration";
import { useT } from "@/lib/i18n/provider";

export interface PodiumPlayer {
  uid: string;
  nick: string;
  avatar: string;
  score: number;
}

// Podsumowanie całej partii — kto wygrał. Wspólne dla gier, bo „kto wygrał" jest
// uniwersalne: gra przekazuje tylko listę graczy z wynikiem.
//
// Remis daje wygraną każdemu z czołowym wynikiem — to gra imprezowa, nie ranking.
// Ta sama zasada co przy zapisie rekordów pokoju (lib/server/records.ts).
const MEDAL = ["#FFD54A", "#CBD5E1", "#D8935B"]; // złoto, srebro, brąz

export function Podium({ players, meUid }: { players: PodiumPlayer[]; meUid: string }) {
  const t = useT();
  if (!players.length) return null;

  const ranked = [...players].sort((a, b) => b.score - a.score);
  const best = ranked[0].score;
  const winners = ranked.filter((p) => p.score === best);
  const solo = winners.length === 1;

  return (
    <section className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <Illustration id="postacie/ziomek-wygrana" className="h-28 w-auto sm:h-32" />
        <p className="font-display text-center text-2xl font-bold uppercase tracking-wide text-ink">
          {solo
            ? t("podium.winner", { nick: winners[0].nick })
            : t("podium.tie", { nicks: winners.map((w) => w.nick).join(", ") })}
        </p>
      </div>

      <ol className="flex w-full flex-col gap-2">
        {ranked.map((p, i) => {
          const isWinner = p.score === best;
          return (
            <li
              key={p.uid}
              className={`flex items-center gap-3 rounded-[14px] border-[3px] px-3 py-2 ${
                isWinner ? "border-bursztyn bg-panel-hi" : "border-stroke bg-panel"
              }`}
            >
              <span className="flex w-6 flex-none justify-center">
                {i < 3 ? (
                  <Medal size={20} strokeWidth={2.5} style={{ color: MEDAL[i] }} aria-hidden />
                ) : (
                  <span className="font-display text-sm font-bold text-ink-muted">{i + 1}</span>
                )}
              </span>
              <AvatarIcon avatar={p.avatar} size={30} />
              <span className="min-w-0 flex-1 truncate font-bold text-ink">
                {p.nick}
                {p.uid === meUid && <span className="font-semibold text-ink-muted"> {t("common.you")}</span>}
              </span>
              <span className="tabular flex-none font-display text-lg font-bold text-ink">{p.score}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
