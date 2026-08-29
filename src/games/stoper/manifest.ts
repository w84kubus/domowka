import { z } from "zod";
import type { GameManifest } from "@/games/types";

// Ustawienia Stopera (SPEC §5.2). Oba tryby: A „CEL" i B „ZGADNIJ CZAS".
export const stoperSettingsSchema = z.object({
  /** Tryb gry (SPEC §5.2): „cel" — trafiasz w zadany czas; „zgadnij" — typujesz cudzy bieg. */
  mode: z.enum(["cel", "zgadnij"]).default("cel"),
  scoring: z.enum(["zwyciestwa", "precyzja"]).default("precyzja"),
  rounds: z
    .union([z.literal(1), z.literal(3), z.literal(5), z.literal(7), z.literal(10), z.literal(0)])
    .default(5), // 0 = bez limitu
  targetMode: z.enum(["losowy", "staly"]).default("losowy"),
  targetMaxMs: z
    .union([z.literal(10000), z.literal(30000), z.literal(60000), z.literal(120000)])
    .default(10000),
  fixedTargetMs: z.number().int().min(2000).max(120000).default(10000),

  /**
   * Po tylu ms od startu rundy runda zamyka się sama; 0 = nigdy.
   * SPEC §5.2 przewiduje limit rundy, ale dotąd służył tylko do przycięcia wyniku —
   * jeśli ktoś nie kliknął STOP, runda wisiała, dopóki host jej ręcznie nie zamknął.
   * Domyślnie 0, żeby zachowanie bez zmiany ustawień było identyczne jak dotąd.
   */
  roundTimeoutMs: z
    .union([z.literal(0), z.literal(30_000), z.literal(60_000), z.literal(120_000)])
    .default(0),

  /**
   * Ile trwa ekran wyników; 0 = host przechodzi ręcznie przyciskiem „Dalej".
   * Wcześniej zaszyte 9 s — za mało, żeby przy kilku graczach przeczytać ranking.
   */
  revealMs: z
    .union([z.literal(5_000), z.literal(9_000), z.literal(15_000), z.literal(30_000), z.literal(0)])
    .default(9_000),

  /** „Bez przekroczenia": kto przekroczy cel, przepada w tej rundzie (jak w Idź na całość). */
  noOvershoot: z.boolean().default(false),
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
  soloPath: "/gry/stoper/trening",
  estimatedMinutes: [5, 15],
  defaultSettings: stoperSettingsSchema.parse({}),
  settingsSchema: stoperSettingsSchema,
};
