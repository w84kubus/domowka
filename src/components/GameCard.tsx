"use client";
import { GameIcon } from "@/components/GameIcon";
import { gameNameKey, gameTaglineKey } from "@/lib/i18n/game";
import { useT } from "@/lib/i18n/provider";
import type { GameManifest } from "@/games/types";

// Karta gry na landingu (mockup „SEKCJA GIER"): ramka w kolorze akcentu gry,
// jasne tło jak karteczka samoprzylepna. Bez interakcji — to wizytówka, nie przycisk.
export function GameCard({
  manifest,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest: GameManifest<any>;
}) {
  const t = useT();
  return (
    <li
      className="game-card flex flex-col gap-2"
      style={{ ["--accent" as string]: manifest.accentColor }}
    >
      {/* Ikona NAD nazwą, nie obok. Nazwa musi się zmieścić w kafelku w każdym języku,
          a przy pięciu kolumnach kafelek ma ok. 210 px: ikona i tytuł w jednym wierszu
          zostawiały tekstowi 126 px, przy czym angielskie „Categories" potrzebuje 130.
          To pojedyncze słowo, więc nie miało się gdzie złamać i wylewało się poza ramkę
          — krótkie nazwy miały margines, długie nie, i stąd brało się wrażenie krzywizny.
          Nad nazwą jest cała szerokość karty i zapas na dłuższe tłumaczenia.
          `break-words` zostaje jako ostatnia deska ratunku. */}
      <GameIcon gameId={manifest.id} size={44} color={manifest.accentColor} />
      <h3 className="font-display break-words text-base font-bold uppercase leading-tight tracking-[0.04em] sm:text-lg">
        {t(gameNameKey(manifest.id))}
      </h3>
      <p className="text-sm font-semibold leading-snug">{t(gameTaglineKey(manifest.id))}</p>
      <p className="font-display mt-auto pt-1 text-xs font-bold uppercase tracking-[0.06em] opacity-60">
        {t("landing.playerRange", { min: manifest.minPlayers, max: manifest.maxPlayers })}
      </p>
    </li>
  );
}
