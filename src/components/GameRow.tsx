"use client";
import { useT } from "@/lib/i18n/provider";
import { GameIcon } from "@/components/GameIcon";
import { gameNameKey, gameTaglineKey } from "@/lib/i18n/game";
import type { GameManifest } from "@/games/types";

// Wiersz gry w lobby (mockup „POKÓJ FFLC"): pasek na pełną szerokość,
// emoji + nazwa + tagline. Wybrany dostaje miętową ramkę z poświatą.
export function GameRow({
  manifest,
  selected,
  enoughPlayers,
  onSelect,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest: GameManifest<any>;
  selected: boolean;
  enoughPlayers: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-[14px] border-[3px] px-3 py-3 text-left transition-transform duration-75 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint focus-visible:outline-offset-2 active:translate-y-[3px] active:shadow-none ${
        selected
          ? "glow-selected bg-panel-hi"
          : "border-stroke bg-panel shadow-[0_3px_0_rgb(0_0_0/0.35)]"
      }`}
    >
      <GameIcon gameId={manifest.id} size={46} color={manifest.accentColor} className="flex-none" />
      <span className="min-w-0 flex-1">
        <span className="font-display block text-base font-bold uppercase tracking-[0.04em] text-ink">
          {t(gameNameKey(manifest.id))}
        </span>
        <span className="block text-sm font-semibold leading-snug text-ink-muted">
          {t(gameTaglineKey(manifest.id))}
        </span>
      </span>
      <span
        className={`font-display flex-none rounded-md px-2 py-1 text-xs font-bold ${
          enoughPlayers ? "bg-mint text-sheet-ink" : "bg-black/25 text-ink-muted"
        }`}
        title={enoughPlayers ? "Możecie grać" : `Potrzeba min. ${manifest.minPlayers} graczy`}
      >
        {manifest.minPlayers}–{manifest.maxPlayers}
      </span>
    </button>
  );
}
