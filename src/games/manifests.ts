// Manifesty gier (client-safe). Importuj to zamiast registry.ts na kliencie —
// registry.ts ciągnie silniki (1700+ linii), klient ich nie potrzebuje.
import type { GameManifest } from "./types";
import { stoperManifest } from "./stoper/manifest";
import { pmManifest } from "./panstwa-miasta/manifest";
import { wisielecManifest } from "./wisielec/manifest";
import { impostorManifest } from "./impostor/manifest";
import { mafiaManifest } from "./mafia/manifest";
import { odcienManifest } from "./odcien/manifest";
import { kasynoManifest } from "./kasyno/manifest";
import { kolkoManifest } from "./kolko/manifest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAME_MANIFESTS: Record<string, GameManifest<any>> = {
  [stoperManifest.id]: stoperManifest,
  [pmManifest.id]: pmManifest,
  [wisielecManifest.id]: wisielecManifest,
  [impostorManifest.id]: impostorManifest,
  [mafiaManifest.id]: mafiaManifest,
  [odcienManifest.id]: odcienManifest,
  [kasynoManifest.id]: kasynoManifest,
  [kolkoManifest.id]: kolkoManifest,
};

/** Manifesty do wyboru gry w lobby (kolejność jak w SPEC §1). */
export const GAME_LIST = Object.values(GAME_MANIFESTS);
