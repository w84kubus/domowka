"use client";
import type { ComponentType } from "react";
import type { GameHostViewProps, GameSettingsProps, GameViewProps } from "./view";
import { StoperSettingsPanel } from "./stoper/Settings";
import { StoperPlayerView } from "./stoper/PlayerView";
import { StoperHostView } from "./stoper/HostView";
import { PmSettingsPanel } from "./panstwa-miasta/Settings";
import { PmPlayerView } from "./panstwa-miasta/PlayerView";
import { PmHostView } from "./panstwa-miasta/HostView";
import { WisielecSettingsPanel } from "./wisielec/Settings";
import { WisielecPlayerView } from "./wisielec/PlayerView";
import { WisielecHostView } from "./wisielec/HostView";

// Komponenty gier (klient). Dodanie gry = jeden wpis. Rozdzielone od registry.ts (silniki),
// żeby serwerowy runner nie ciągnął Reacta.
export interface GameComponents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Settings: ComponentType<GameSettingsProps<any>>;
  PlayerView: ComponentType<GameViewProps>;
  HostView: ComponentType<GameHostViewProps>;
}

export const GAME_COMPONENTS: Record<string, GameComponents> = {
  stoper: { Settings: StoperSettingsPanel, PlayerView: StoperPlayerView, HostView: StoperHostView },
  "panstwa-miasta": { Settings: PmSettingsPanel, PlayerView: PmPlayerView, HostView: PmHostView },
  wisielec: { Settings: WisielecSettingsPanel, PlayerView: WisielecPlayerView, HostView: WisielecHostView },
};
