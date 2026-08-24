import { z } from "zod";
import type { GameManifest } from "@/games/types";

// Kasyno — cztery tryby losowe na wirtualne żetony (SPEC: nowa gra, §5.7).
export const kasynoSettingsSchema = z.object({
  /**
   * Tryb. Wszystkie poza slotami dzielą tę samą animację przewijanego paska —
   * różni je tylko zawartość kafelków i sposób losowania.
   */
  mode: z.enum(["jackpot", "double", "wheel", "sloty"]).default("jackpot"),
  /** Ile żetonów dostaje każdy na start. */
  startChips: z.union([z.literal(500), z.literal(1000), z.literal(2000)]).default(1000),
  /** Ile trwa okno zakładów. */
  betMs: z.union([z.literal(15000), z.literal(20000), z.literal(30000)]).default(20000),
  /** Minimalny zakład. */
  minBet: z.union([z.literal(5), z.literal(10), z.literal(25)]).default(10),
  /**
   * Wpisowe pobierane co rundę od każdego, kto jeszcze gra.
   * Bez niego gracz, który przestanie obstawiać, nigdy nie zbankrutuje i partia
   * „do ostatniego stojącego" nie miałaby jak się skończyć. Rośnie co 5 rund,
   * jak ciemne w pokerze — inaczej przy 1000 żetonów trwałoby to wieczność.
   */
  ante: z.union([z.literal(0), z.literal(10), z.literal(25)]).default(10),
});

export type KasynoSettings = z.infer<typeof kasynoSettingsSchema>;

export const kasynoManifest: GameManifest<KasynoSettings> = {
  id: "kasyno",
  name: "Kasyno",
  tagline: "Obstawiaj żetony. Kto zostanie z pustymi rękami, odpada.",
  emoji: "🎰",
  accentColor: "#F0B429", // złoto — odróżnia się od sześciu istniejących akcentów
  minPlayers: 2,
  maxPlayers: 16,
  supportsHostScreen: true,
  estimatedMinutes: [10, 25],
  defaultSettings: kasynoSettingsSchema.parse({}),
  settingsSchema: kasynoSettingsSchema,
};
