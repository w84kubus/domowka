"use client";
import { useState } from "react";
import { GAME_LIST } from "@/games/registry";
import { GAME_COMPONENTS } from "@/games/components";
import { apiPost } from "@/lib/client/api";
import { ApiClientError } from "@/lib/client/api";

// Wybór gry + ustawienia (host) w lobby (SPEC §4). Selekcja jest lokalna u hosta do startu.
export function LobbyGames({
  code,
  isHost,
  playerCount,
}: {
  code: string;
  isHost: boolean;
  playerCount: number;
}) {
  const [gameId, setGameId] = useState(GAME_LIST[0]?.id ?? "");
  const manifest = GAME_LIST.find((g) => g.id === gameId);
  const [settings, setSettings] = useState<unknown>(manifest?.defaultSettings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isHost) {
    return (
      <p className="text-center text-sm text-[var(--color-tekst-drugi)]">
        Host wybiera grę i ustawienia. Za chwilę ruszamy…
      </p>
    );
  }

  const pick = (id: string) => {
    setGameId(id);
    setSettings(GAME_LIST.find((g) => g.id === id)?.defaultSettings);
    setError(null);
  };

  const enoughPlayers = manifest ? playerCount >= manifest.minPlayers : false;
  const SettingsPanel = manifest ? GAME_COMPONENTS[manifest.id]?.Settings : null;

  const start = async () => {
    if (!manifest) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/api/rooms/${code}/start`, { gameId, settings });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Nie udało się zacząć.");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">Gra</span>
        <div className="grid grid-cols-1 gap-2">
          {GAME_LIST.map((g) => {
            const selected = g.id === gameId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => pick(g.id)}
                className="card flex items-center gap-3 px-4 py-3 text-left"
                style={selected ? { borderColor: g.accentColor, boxShadow: `0 0 16px ${g.accentColor}44` } : undefined}
              >
                <span className="text-3xl">{g.emoji}</span>
                <span className="flex-1">
                  <span className="block font-semibold" style={{ fontFamily: "var(--font-display)" }}>{g.name}</span>
                  <span className="block text-xs text-[var(--color-tekst-drugi)]">{g.tagline}</span>
                </span>
                <span className="text-xs text-[var(--color-tekst-drugi)]">{g.minPlayers}–{g.maxPlayers}</span>
              </button>
            );
          })}
        </div>
      </div>

      {SettingsPanel && manifest && (
        <div className="card flex flex-col gap-4 p-4">
          <span className="text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">Ustawienia</span>
          <SettingsPanel value={settings} onChange={setSettings} playerCount={playerCount} />
        </div>
      )}

      {error && <p className="text-center text-sm text-[var(--color-magenta)]">{error}</p>}

      <button
        type="button"
        className="btn btn-accent"
        style={{ ["--accent" as string]: manifest?.accentColor }}
        disabled={!enoughPlayers || busy}
        onClick={start}
      >
        {busy ? "Startuję…" : enoughPlayers ? "Zaczynamy!" : `Potrzeba min. ${manifest?.minPlayers} graczy`}
      </button>
    </div>
  );
}
