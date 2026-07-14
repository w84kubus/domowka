// Rejestr gier (SPEC §3.4). Dodanie nowej gry = jeden import + jeden wpis tutaj.
// Zero zmian w rdzeniu. Ten plik trzyma TYLKO czyste silniki + manifesty (bez Reacta),
// więc jest bezpieczny i na serwerze (runner), i na kliencie (metadane).
import type { GameEngine, GameManifest } from "./types";
import { stoperManifest } from "./stoper/manifest";
import { stoperEngine } from "./stoper/engine";

export interface GameEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest: GameManifest<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: GameEngine<any, any, any>;
}

export const GAMES: Record<string, GameEntry> = {
  [stoperManifest.id]: { manifest: stoperManifest, engine: stoperEngine },
};

/** Manifesty do wyboru gry w lobby (kolejność jak w SPEC §1). */
export const GAME_LIST = Object.values(GAMES).map((g) => g.manifest);
