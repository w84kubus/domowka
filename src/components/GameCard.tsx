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
      <h3 className="font-display flex items-center gap-2 text-lg font-bold uppercase tracking-[0.04em]">
        <GameIcon gameId={manifest.id} size={30} color={manifest.accentColor} />
        {t(gameNameKey(manifest.id))}
      </h3>
      <p className="text-sm font-semibold leading-snug">{t(gameTaglineKey(manifest.id))}</p>
      <p className="font-display mt-auto pt-1 text-xs font-bold uppercase tracking-[0.06em] opacity-60">
        {t("landing.playerRange", { min: manifest.minPlayers, max: manifest.maxPlayers })}
      </p>
    </li>
  );
}
