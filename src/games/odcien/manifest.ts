import { z } from "zod";
import type { GameManifest } from "@/games/types";

// Odcień — gra na pamięć kolorów. Kolor błyska na kilka sekund, potem odtwarzasz go suwakami.
export const odcienSettingsSchema = z.object({
  /** Ile sekund widać kolor, zanim zniknie. */
  showMs: z.union([z.literal(3000), z.literal(5000), z.literal(8000)]).default(5000),
  /** Suwaki: RGB (jak w oryginale) albo HSL (dużo bardziej intuicyjne dla ludzi). */
  space: z.enum(["rgb", "hsl"]).default("rgb"),
  rounds: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(7), z.literal(10), z.literal(0)]).default(5),
  scoring: z.enum(["precyzja", "zwyciestwa"]).default("precyzja"),
  /** Ile trwa ekran wyników (0 = host klika Dalej). */
  revealMs: z.union([z.literal(5000), z.literal(9000), z.literal(15000), z.literal(0)]).default(9000),
});

export type OdcienSettings = z.infer<typeof odcienSettingsSchema>;

export const odcienManifest: GameManifest<OdcienSettings> = {
  id: "odcien",
  name: "Odcień",
  tagline: "Zapamiętaj kolor. Odtwórz go z pamięci.",
  emoji: "🎨",
  accentColor: "#FF8A3D", // pomarańcz — odróżnia się od pięciu istniejących akcentów
  minPlayers: 1,
  maxPlayers: 16,
  supportsHostScreen: true,
  estimatedMinutes: [5, 12],
  defaultSettings: odcienSettingsSchema.parse({}),
  settingsSchema: odcienSettingsSchema,
};
