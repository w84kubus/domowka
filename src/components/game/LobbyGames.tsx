"use client";
import { useT } from "@/lib/i18n/provider";
import { useState } from "react";
import { GAME_LIST } from "@/games/manifests";
import { GAME_COMPONENTS } from "@/games/components";
import { GameRulesCard } from "@/components/game/GameRulesCard";
import { GameRow } from "@/components/GameRow";
import { apiPost } from "@/lib/client/api";
import { ApiClientError } from "@/lib/client/api";

// Wybór gry + ustawienia (host) w lobby (SPEC §4). Selekcja jest lokalna u hosta do startu.
export function LobbyGames({
  code,
  isHost,
  playerCount,
  gameId,
  onGameChange,
}: {
  code: string;
  isHost: boolean;
  playerCount: number;
  /** Wybrana gra. Trzymana wyżej, bo lobby musi wiedzieć, ilu graczy wymaga. */
  gameId: string;
  onGameChange: (id: string) => void;
}) {
  const t = useT();
  const manifest = GAME_LIST.find((g) => g.id === gameId);
  const [settings, setSettings] = useState<unknown>(manifest?.defaultSettings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isHost) {
    return (
      <p className="card text-center text-base font-semibold leading-relaxed text-ink-muted">
        {t("lobby.hostPicks")}
      </p>
    );
  }

  const pick = (id: string) => {
    onGameChange(id);
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
      setError(err instanceof ApiClientError ? err.message : t("lobby.startFailed"));
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-[0.06em] text-mint">{t("lobby.game")}</h2>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("lobby.pickGame")}>
          {GAME_LIST.map((g) => (
            <GameRow
              key={g.id}
              manifest={g}
              selected={g.id === gameId}
              enoughPlayers={playerCount >= g.minPlayers}
              onSelect={() => pick(g.id)}
            />
          ))}
        </div>
      </div>

      {manifest && (
        <div className="flex justify-center">
          <GameRulesCard manifest={manifest} />
        </div>
      )}

      {SettingsPanel && manifest && (
        <div className="card flex flex-col gap-4">
          <span className="font-display text-sm font-bold uppercase tracking-[0.06em] text-mint">
            {t("lobby.settings")}
          </span>
          <SettingsPanel value={settings} onChange={setSettings} playerCount={playerCount} />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[14px] border-[3px] border-white/40 bg-czerwien/90 px-4 py-3 text-center text-sm font-bold text-white shadow-[0_3px_0_rgb(0_0_0/0.35)]"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn-lime text-2xl"
        disabled={!enoughPlayers || busy}
        onClick={start}
      >
        {busy ? t("lobby.starting") : enoughPlayers ? t("lobby.start") : t("lobby.needPlayers", { min: manifest?.minPlayers ?? 0 })}
      </button>
    </div>
  );
}
