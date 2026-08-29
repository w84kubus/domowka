import { z } from "zod";
import type { GameManifest } from "@/games/types";

// Kółko i krzyżyk (SPEC §9, faza 2). Gra dwuosobowa w aplikacji, w której pokój
// ma do 16 osób — dlatego pary ROTUJĄ, zamiast blokować grę reszcie.
export const kolkoSettingsSchema = z.object({
  /** Rund w partii. 0 = bez limitu, host kończy ręcznie. */
  rounds: z.union([z.literal(3), z.literal(5), z.literal(7), z.literal(0)]).default(5),
  /**
   * Ile czasu na ruch. Bez limitu gra potrafi stanąć, gdy ktoś odłoży telefon,
   * a przy stole czeka na to reszta pokoju.
   */
  moveMs: z.union([z.literal(10000), z.literal(20000), z.literal(0)]).default(20000),
  /**
   * Kto gra następną rundę. „Wygrany zostaje" to zasada z automatów i najlepiej
   * pasuje do domówki: dobry gracz trzyma stołek, reszta chce go zrzucić.
   */
  winnerStays: z.boolean().default(true),
});

export type KolkoSettings = z.infer<typeof kolkoSettingsSchema>;

export const kolkoManifest: GameManifest<KolkoSettings> = {
  id: "kolko",
  name: "Kółko i krzyżyk",
  tagline: "Klasyk na trzy w rzędzie. Wygrany zostaje przy stole.",
  emoji: "⭕",
  accentColor: "#22D3EE", // cyjan — wolny wśród siedmiu istniejących akcentów
  minPlayers: 2,
  maxPlayers: 16,
  supportsHostScreen: true,
  estimatedMinutes: [5, 15],
  defaultSettings: kolkoSettingsSchema.parse({}),
  settingsSchema: kolkoSettingsSchema,
};
