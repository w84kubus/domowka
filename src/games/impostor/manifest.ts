import { z } from "zod";
import type { GameManifest } from "@/games/types";

export const impostorSettingsSchema = z.object({
  impostorCount: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  impostorsKnow: z.boolean().default(true), // czy impostorzy się znają (przy 2+)
  hintType: z.enum(["BRAK", "KATEGORIA", "PIERWSZA_LITERA", "PODPOWIEDZ", "SLOWO_POWIAZANE"]).default("KATEGORIA"),
  impostorKnows: z.boolean().default(true), // czy impostor wie, że jest impostorem
  clueRounds: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  speakMode: z.enum(["na_glos", "tekstowy"]).default("tekstowy"),
  impostorNeverStarts: z.boolean().default(true),
  discussionMs: z.union([z.literal(60000), z.literal(90000), z.literal(120000), z.literal(0)]).default(90000),
  postEjectGuess: z.boolean().default(true),
  impostorCanGuessAnytime: z.boolean().default(false),
  rounds: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(0)]).default(3),
});

export type ImpostorSettings = z.infer<typeof impostorSettingsSchema>;

export const impostorManifest: GameManifest<ImpostorSettings> = {
  id: "impostor",
  name: "Impostor",
  tagline: "Wszyscy znają hasło. Prawie wszyscy.",
  emoji: "🕵️",
  accentColor: "#FF2D95", // magenta
  minPlayers: 3,
  maxPlayers: 16,
  supportsHostScreen: true,
  estimatedMinutes: [5, 15],
  defaultSettings: impostorSettingsSchema.parse({}),
  settingsSchema: impostorSettingsSchema,
};
