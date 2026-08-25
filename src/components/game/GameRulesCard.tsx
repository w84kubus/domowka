"use client";
import { GameIcon } from "@/components/GameIcon";
import { Lightbulb, X } from "lucide-react";
import { useState } from "react";
import { GAME_RULES } from "@/games/rules";
import { useI18n } from "@/lib/i18n/provider";
import type { GameManifest } from "@/games/types";
import { gameNameKey, gameTaglineKey } from "@/lib/i18n/game";

// G3 (UPGRADE.md §G): ekran zasad gry — dostępny z lobby, jedna karta, bez ściany tekstu.

export function GameRulesCard({
  manifest,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest: GameManifest<any>;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const rules = GAME_RULES[locale][manifest.id];
  if (!rules) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        {t("rules.howToPlay")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label={t("rules.howToPlay")}
        >
          {/* tło */}
          <div className="fixed inset-0 bg-black/60 animate-[fadeIn_0.15s_ease]" aria-hidden />

          {/* arkusz z zeszytu (DESIGN.md §4.4) */}
          <div className="relative z-10 w-full max-w-md">
            {/* spirala u góry */}
            <div className="pointer-events-none absolute -top-4 left-0 right-0 z-20 flex justify-center gap-8" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block h-9 w-6 rounded-full border-[5px] border-white/80"
                  style={{ transform: `rotate(${i % 2 ? 10 : -10}deg)` }}
                />
              ))}
            </div>

            <div className="arcade-pop flex max-h-[85dvh] flex-col overflow-hidden rounded-[20px] bg-sheet shadow-[0_18px_40px_rgb(0_0_0/0.35)]">
              <header className="flex items-center gap-3 bg-primary px-5 py-4">
                <GameIcon gameId={manifest.id} size={44} className="flex-none text-white" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display truncate text-lg font-bold uppercase tracking-[0.04em] text-white">
                    {t(gameNameKey(manifest.id))}
                  </h2>
                  <p className="truncate text-sm font-semibold text-white/80">{t(gameTaglineKey(manifest.id))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-11 flex-none items-center justify-center rounded-lg text-xl font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint"
                  aria-label={t("common.close")}
                >
                  <X size={20} strokeWidth={3} aria-hidden />
                </button>
              </header>

              <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5 text-sheet-ink">
                <p className="text-base font-semibold leading-relaxed">{rules.howTo}</p>

                <ol className="flex flex-col gap-3">
                  {rules.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="font-display flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: manifest.accentColor }}
                      >
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-base font-semibold leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>

                {rules.tip && (
                  <p className="rounded-[14px] border-2 border-black/10 bg-black/5 px-4 py-3 text-sm font-semibold">
                    <Lightbulb size={16} strokeWidth={2.5} className="inline-block align-[-0.18em]" aria-hidden /> {rules.tip}
                  </p>
                )}

                <p className="font-display text-center text-xs font-bold uppercase tracking-[0.06em] opacity-60">
                  {t("rules.meta", { min: manifest.minPlayers, max: manifest.maxPlayers, from: manifest.estimatedMinutes[0], to: manifest.estimatedMinutes[1] })}
                </p>
              </div>
            </div>

            {/* stos kartek u dołu */}
            <div className="pointer-events-none absolute inset-x-3 -bottom-1 h-2 rounded-b-[16px] bg-white/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-6 -bottom-2 h-2 rounded-b-[16px] bg-white/50" aria-hidden />
          </div>
        </div>
      )}
    </>
  );
}
