import { z } from "zod";
import type { GameManifest } from "@/games/types";

// Ustawienia Stopera (SPEC §5.2). Na razie tryb A „CEL"; tryb B „ZGADNIJ" dojdzie.
export const stoperSettingsSchema = z.object({
  scoring: z.enum(["zwyciestwa", "precyzja"]).default("precyzja"),
  rounds: z.union([z.literal(3), z.literal(5), z.literal(7), z.literal(0)]).default(5), // 0 = bez limitu
  targetMode: z.enum(["losowy", "staly"]).default("losowy"),
  targetMaxMs: z
    .union([z.literal(10000), z.literal(30000), z.literal(60000), z.literal(120000)])
    .default(10000),
  fixedTargetMs: z.number().int().min(2000).max(120000).default(10000),
});

export type StoperSettings = z.infer<typeof stoperSettingsSchema>;

export const stoperManifest: GameManifest<StoperSettings> = {
  id: "stoper",
  name: "Stoper",
  tagline: "Zatrzymaj w idealnym momencie. Bez patrzenia na cyfry.",
  emoji: "⏱️",
  accentColor: "#CCFF00", // limonka
  minPlayers: 1,
  maxPlayers: 16,
  supportsHostScreen: true,
  estimatedMinutes: [5, 15],
  defaultSettings: stoperSettingsSchema.parse({}),
  settingsSchema: stoperSettingsSchema,
};
