import { z } from "zod";
import type { GameManifest } from "@/games/types";

export const wisielecSettingsSchema = z.object({
  mode: z.enum(["zadajacy", "wyscig", "kooperacja"]).default("wyscig"),
  wordSet: z.enum(["zwierzeta", "jedzenie", "filmy", "miasta", "marki", "sport", "zawody", "dom", "trudne"]).default("zwierzeta"),
  lives: z.union([z.literal(6), z.literal(8), z.literal(10)]).default(8),
  rounds: z.union([z.literal(3), z.literal(5), z.literal(0)]).default(3),
  ignoreOgonki: z.boolean().default(false),
  extraLetters: z.boolean().default(false), // Q V X w klawiaturze
  hitContinues: z.boolean().default(true), // tryb ZADAJĄCY: trafienie = kolejna tura
});

export type WisielecSettings = z.infer<typeof wisielecSettingsSchema>;

export const wisielecManifest: GameManifest<WisielecSettings> = {
  id: "wisielec",
  name: "Wisielec",
  tagline: "Zgadnij hasło, zanim ludzik zawiśnie.",
  emoji: "🪢",
  accentColor: "#FFB627", // bursztyn
  minPlayers: 1,
  maxPlayers: 16,
  supportsHostScreen: true,
  estimatedMinutes: [5, 20],
  defaultSettings: wisielecSettingsSchema.parse({}),
  settingsSchema: wisielecSettingsSchema,
};
