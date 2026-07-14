import { z } from "zod";
import type { GameManifest } from "@/games/types";

export const mafiaSettingsSchema = z.object({
  mafiaCount: z.number().int().min(0).max(5).default(0), // 0 = auto-balans
  revealRoles: z.boolean().default(true), // ujawniać rolę po śmierci
  discussionMs: z.union([z.literal(120000), z.literal(180000), z.literal(300000), z.literal(0)]).default(180000),
  lastWord: z.boolean().default(false),
  doctorSelfSave: z.boolean().default(true),
  doctorNoRepeat: z.boolean().default(true), // lekarz nie może ratować tej samej osoby 2× z rzędu
  secretVoting: z.boolean().default(false),
});

export type MafiaSettings = z.infer<typeof mafiaSettingsSchema>;

// Auto-balans mafii (SPEC §5.6): 6-7→2, 8-10→3, 11-13→4, 14-16→5; poniżej 6 → 1.
export function autoMafiaCount(players: number): number {
  if (players >= 14) return 5;
  if (players >= 11) return 4;
  if (players >= 8) return 3;
  if (players >= 6) return 2;
  return 1;
}

export const mafiaManifest: GameManifest<MafiaSettings> = {
  id: "mafia",
  name: "Mafia",
  tagline: "Miasto śpi. Mafia nie.",
  emoji: "🔪",
  accentColor: "#E4002B", // czerwień
  minPlayers: 4,
  maxPlayers: 16,
  supportsHostScreen: true,
  estimatedMinutes: [15, 45],
  defaultSettings: mafiaSettingsSchema.parse({}),
  settingsSchema: mafiaSettingsSchema,
};
