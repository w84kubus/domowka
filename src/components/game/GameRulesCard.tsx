"use client";
import { useState } from "react";
import { GAME_RULES } from "@/games/rules";
import type { GameManifest } from "@/games/types";

// G3 (UPGRADE.md §G): ekran zasad gry — dostępny z lobby, jedna karta, bez ściany tekstu.

export function GameRulesCard({
  manifest,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest: GameManifest<any>;
}) {
  const [open, setOpen] = useState(false);
  const rules = GAME_RULES[manifest.id];
  if (!rules) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-[var(--color-tekst-drugi)] underline underline-offset-4"
      >
        Jak grać?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          role="dialog"
          aria-label={`Zasady: ${manifest.name}`}
        >
          {/* tło */}
          <div className="fixed inset-0 bg-black/60 animate-[fadeIn_0.15s_ease]" aria-hidden />

          {/* karta */}
          <div
            className="relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-[slideIn_0.2s_ease]"
            style={{
              background: "var(--color-powierzchnia)",
              border: "1px solid var(--color-obramowanie)",
            }}
          >
            <header className="flex items-center gap-3 border-b border-[var(--color-obramowanie)] px-5 py-4">
              <span className="text-3xl">{manifest.emoji}</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  {manifest.name}
                </h2>
                <p className="text-sm text-[var(--color-tekst-drugi)]">{manifest.tagline}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-xl text-[var(--color-tekst-drugi)]"
                aria-label="Zamknij"
              >
                ✕
              </button>
            </header>

            <div className="flex flex-col gap-4 px-5 py-4">
              <p className="text-sm leading-relaxed">{rules.howTo}</p>

              <ol className="flex flex-col gap-2 text-sm">
                {rules.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: `color-mix(in srgb, ${manifest.accentColor} 20%, var(--color-powierzchnia))`,
                        color: manifest.accentColor,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[var(--color-tekst-drugi)]">{step}</span>
                  </li>
                ))}
              </ol>

              {rules.tip && (
                <p className="rounded-xl bg-[var(--color-uniesione)] px-4 py-3 text-xs text-[var(--color-tekst-drugi)]">
                  💡 {rules.tip}
                </p>
              )}

              <p className="text-center text-xs text-[var(--color-tekst-drugi)]">
                {manifest.minPlayers}–{manifest.maxPlayers} graczy · ~{manifest.estimatedMinutes[0]}–{manifest.estimatedMinutes[1]} min
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
