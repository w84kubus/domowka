import type { ZodType } from "zod";
import type { PlayerMap } from "@/lib/types/room";

// Kontrakt pluginu gry (SPEC §3.4). To jest RDZEŃ — nie dodajemy tu wyjątków dla konkretnej
// gry. Jeśli jakaś gra się nie mieści, poprawiamy interfejs uniformnie, nie rdzeń pod nią.

export interface GameEvent {
  type: string;
  /** Gotowy polski tekst do feedu w Firestore (SPEC §3.2) — czytelny przy debugowaniu. */
  text: string;
  /**
   * Klucz tłumaczenia dla UI. Gdy jest, interfejs pokazuje przetłumaczoną wersję
   * zamiast `text`. Opcjonalny: silnik bez klucza działa jak dotąd, po polsku.
   */
  key?: string;
  params?: Record<string, string | number>;
  meta?: Record<string, unknown>;
}

/** Rzucane przez reduce przy niedozwolonej akcji. Route Handler mapuje na 4xx. */
export class GameError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

export interface InitContext<C> {
  players: PlayerMap;
  seatOrder: string[]; // losowany raz przy starcie (SPEC §8, pkt 8)
  settings: C;
  now: number; // czas serwera
  rng: () => number; // deterministyczny PRNG (seed w stanie)
  seed: number;
}

export interface ActionContext {
  uid: string; // kto wykonuje akcję
  now: number; // czas SERWERA
  rng: () => number; // deterministyczny PRNG
}

/** Akcja wygaśnięcia fazy — wstrzykuje ją serwer przez /tick (SPEC §3.5), nie klient. */
export type TimeoutAction = { type: "PHASE_TIMEOUT" };

export interface GameEngine<S, A, C> {
  id: string;

  /** Waliduje akcję przychodzącą z klienta (SPEC §2, Zod). Nie zawiera PHASE_TIMEOUT. */
  actionSchema: ZodType<A>;

  /** Stan początkowy. Losowość z ctx.rng, czas z ctx.now — nigdy Math.random/Date.now. */
  init(ctx: InitContext<C>): S;

  /** Czysta, deterministyczna redukcja. Rzuca GameError przy niedozwolonej akcji. */
  reduce(state: S, action: A | TimeoutAction, ctx: ActionContext): S;

  /** Co widzą WSZYSCY. Tu nie może trafić nic tajnego (SPEC §3.1). */
  publicView(state: S, players: PlayerMap): unknown;

  /** Co widzi konkretny gracz (jego rola/karta/wynik przed odsłonięciem). */
  privateView(state: S, uid: string): unknown;

  /** Nazwa aktualnej fazy + absolutny czas serwera jej końca (null = bez limitu). */
  phase(state: S): { name: string; endsAt: number | null };

  isFinished(state: S): boolean;

  /** Wynik bieżącej gry per uid (dodawany do totalScore na koniec). */
  scores(state: S): Record<string, number>;

  /** Zdarzenia wygenerowane przez ostatnią redukcję. Runner je zapisuje i czyści (SPEC §3.4). */
  drainEvents(state: S): GameEvent[];
}

export interface GameManifest<C = unknown> {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  accentColor: string; // hex z tabeli §1
  minPlayers: number;
  maxPlayers: number;
  supportsHostScreen: boolean;
  estimatedMinutes: [number, number];
  defaultSettings: C;
  settingsSchema: ZodType<C>;
}

// Pomocniczy typ: stan gry musi umieć nosić bufor zdarzeń do drainEvents.
export interface WithEvents {
  pendingEvents: GameEvent[];
}
