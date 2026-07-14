import { z } from "zod";
import type { GameManifest } from "@/games/types";

export const pmSettingsSchema = z.object({
  categorySet: z.enum(["klasyk", "rozszerzony", "popkultura", "wiedza", "motoryzacja", "impreza"]).default("klasyk"),
  customCategories: z.array(z.string().min(1).max(40)).max(12).optional(),
  rounds: z.union([z.literal(3), z.literal(5), z.literal(8), z.literal(0)]).default(5), // 0 = bez limitu
  endMode: z.enum(["stop", "czas", "recznie"]).default("stop"),
  timeLimitMs: z.union([z.literal(60000), z.literal(90000), z.literal(120000), z.literal(180000)]).default(90000),
  graceMs: z.union([z.literal(5000), z.literal(10000), z.literal(15000)]).default(10000),
  hardcore: z.boolean().default(false),
});

export type PmSettings = z.infer<typeof pmSettingsSchema>;

export const pmManifest: GameManifest<PmSettings> = {
  id: "panstwa-miasta",
  name: "Państwa-miasta",
  tagline: "Litera pada, długopisy w ruch. Kto pierwszy, ten lepszy.",
  emoji: "✍️",
  accentColor: "#22D3EE", // cyjan
  minPlayers: 1,
  maxPlayers: 16,
  supportsHostScreen: true,
  estimatedMinutes: [10, 25],
  defaultSettings: pmSettingsSchema.parse({}),
  settingsSchema: pmSettingsSchema,
};
