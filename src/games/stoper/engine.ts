import { z } from "zod";
import type { PlayerMap } from "@/lib/types/room";
import {
  GameError,
  type GameEngine,
  type GameEvent,
  type InitContext,
  type WithEvents,
} from "@/games/types";
import { type StoperSettings } from "./manifest";

// Stoper, tryb A „CEL" (SPEC §5.2). Silnik jest CZYSTĄ funkcją: zero Date.now/Math.random,
// czas i losowość z ctx. Pomiar dzieje się na kliencie (performance.now), tu przychodzi wynik.

const MIN_TARGET_MS = 2000;
const MIN_VALID_MS = 50; // < 50 ms = przypadkowy klik (SPEC §5.2)
const PERFECT_MS = 50; // błąd < 0,05 s = idealne trafienie

type Phase = "pomiar" | "odsloniecie" | "koniec";

interface Result {
  valueMs: number; // zmierzony czas gracza
  errorMs: number; // |valueMs - target|
  signedMs: number; // valueMs - target (dodatni = za późno)
  suspicious: boolean; // fizycznie niemożliwy wg zegara serwera
}

export interface StoperState extends WithEvents {
  settings: StoperSettings;
  hostUid: string;
  playerUids: string[];
  round: number;
  phase: Phase;
  phaseEndsAt: number | null;
  roundStartedAt: number;
  target: number; // cel bieżącej rundy (ms)
  results: Record<string, Result>;
  scores: Record<string, number>;
  perfectHits: string[]; // uid z idealnym trafieniem w tej rundzie
}

export const stoperActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SUBMIT"), valueMs: z.number().finite() }),
  z.object({ type: z.literal("NEXT") }), // host: dalej z odsłonięcia
  z.object({ type: z.literal("FINISH") }), // host: zakończ grę (potrzebne przy rundach bez limitu)
]);
export type StoperAction = z.infer<typeof stoperActionSchema>;

function generateTarget(settings: StoperSettings, rng: () => number): number {
  if (settings.targetMode === "staly") return settings.fixedTargetMs;
  const span = settings.targetMaxMs - MIN_TARGET_MS;
  // zaokrąglenie do 10 ms — ładny cel typu 7,43 s
  return Math.round((MIN_TARGET_MS + rng() * span) / 10) * 10;
}

/** Limit rundy = 3× cel (SPEC §5.2): kto nie zdąży, przepada. */
function roundLimitMs(target: number): number {
  return 3 * target;
}

function beginRound(state: StoperState, round: number, now: number, rng: () => number): StoperState {
  const target = generateTarget(state.settings, rng);
  // Termin rundy (SPEC §5.2). Przy 0 runda trwa aż wszyscy klikną STOP albo host ją zamknie —
  // tak działało to zawsze i taka jest wartość domyślna. Ustawiony termin domyka rundę sam,
  // więc pojedynczy gracz, który odłożył telefon, nie blokuje reszty w nieskończoność.
  const limit = state.settings.roundTimeoutMs;
  return {
    ...state,
    round,
    phase: "pomiar",
    target,
    roundStartedAt: now,
    phaseEndsAt: limit > 0 ? now + limit : null,
    results: {},
    perfectHits: [],
    pendingEvents: [{ type: "runda", text: `Runda ${round}: cel ${fmt(target)}` }],
  };
}

function fmt(ms: number): string {
  return (ms / 1000).toFixed(2).replace(".", ",") + " s";
}

/** W wariancie „bez przekroczenia" przekroczenie celu pali wynik. */
function busted(state: StoperState, uid: string): boolean {
  const r = state.results[uid];
  return !!r && state.settings.noOvershoot && r.signedMs > 0;
}

/**
 * Ranking rosnąco wg błędu. Kolejność: najpierw ważne wyniki, potem spaleni
 * (przekroczyli cel w wariancie „bez przekroczenia"), na końcu ci bez wyniku.
 */
function ranked(state: StoperState): string[] {
  const rank = (uid: string) => {
    const r = state.results[uid];
    if (!r) return 2;
    return busted(state, uid) ? 1 : 0;
  };
  return [...state.playerUids].sort((a, b) => {
    const ga = rank(a);
    const gb = rank(b);
    if (ga !== gb) return ga - gb;
    return (state.results[a]?.errorMs ?? Infinity) - (state.results[b]?.errorMs ?? Infinity);
  });
}

/** Punktacja rundy dodawana do scores (SPEC §5.2). Spaleni nie punktują. */
function applyScoring(state: StoperState): { scores: Record<string, number>; events: GameEvent[] } {
  const order = ranked(state);
  const withResult = order.filter((uid) => state.results[uid] && !busted(state, uid));
  const scores = { ...state.scores };
  const events: GameEvent[] = [];

  if (state.settings.scoring === "zwyciestwa") {
    const best = withResult.length ? state.results[withResult[0]].errorMs : Infinity;
    for (const uid of withResult) {
      if (state.results[uid].errorMs === best) scores[uid] = (scores[uid] ?? 0) + 1;
    }
  } else {
    const n = withResult.length;
    withResult.forEach((uid, idx) => {
      let pts = 3;
      if (idx === 0) pts = 10;
      else if (idx === 1) pts = 7;
      else if (idx === 2) pts = 5;
      else if (idx === n - 1) pts = 1;
      scores[uid] = (scores[uid] ?? 0) + pts;
    });
  }

  for (const uid of state.perfectHits) {
    events.push({ type: "idealnie", text: `Idealne trafienie! (${fmt(state.results[uid].valueMs)})`, meta: { uid } });
  }
  return { scores, events };
}

function toReveal(state: StoperState, now: number): StoperState {
  const { scores, events } = applyScoring(state);
  return {
    ...state,
    phase: "odsloniecie",
    // 0 = bez auto-przejścia; wtedy rundę domyka host przyciskiem „Dalej".
    phaseEndsAt: state.settings.revealMs > 0 ? now + state.settings.revealMs : null,
    scores,
    pendingEvents: events,
  };
}

function advanceOrFinish(state: StoperState, now: number, rng: () => number): StoperState {
  const total = state.settings.rounds;
  const isLast = total !== 0 && state.round >= total;
  if (isLast) {
    return {
      ...state,
      phase: "koniec",
      phaseEndsAt: null,
      pendingEvents: [{ type: "koniec", text: "Koniec gry!" }],
    };
  }
  return beginRound(state, state.round + 1, now, rng);
}

export const stoperEngine: GameEngine<StoperState, StoperAction, StoperSettings> = {
  id: "stoper",
  actionSchema: stoperActionSchema,

  init(ctx: InitContext<StoperSettings>): StoperState {
    const hostUid = Object.values(ctx.players).find((p) => p.isHost)?.uid ?? ctx.seatOrder[0];
    const base: StoperState = {
      settings: ctx.settings,
      hostUid,
      playerUids: ctx.seatOrder.length ? ctx.seatOrder : Object.keys(ctx.players),
      round: 0,
      phase: "pomiar",
      phaseEndsAt: null,
      roundStartedAt: ctx.now,
      target: 0,
      results: {},
      scores: {},
      perfectHits: [],
      pendingEvents: [],
    };
    return beginRound(base, 1, ctx.now, ctx.rng);
  },

  reduce(state, action, ctx): StoperState {
    if (action.type === "PHASE_TIMEOUT") {
      if (state.phase === "pomiar") return toReveal(state, ctx.now);
      if (state.phase === "odsloniecie") return advanceOrFinish(state, ctx.now, ctx.rng);
      return state;
    }

    if (action.type === "FINISH") {
      // Bez tego przy rundach „∞" gry nie da się skończyć inaczej niż wyjściem z pokoju.
      if (ctx.uid !== state.hostUid) throw new GameError("Tylko host może zakończyć grę.", 403);
      if (state.phase === "koniec") return state;
      // Z pomiaru najpierw rozliczamy to, co gracze zdążyli zgłosić.
      const settled = state.phase === "pomiar" ? toReveal(state, ctx.now) : state;
      return {
        ...settled,
        phase: "koniec",
        phaseEndsAt: null,
        pendingEvents: [...(settled.pendingEvents ?? []), { type: "koniec", text: "Koniec gry!" }],
      };
    }

    if (action.type === "NEXT") {
      if (ctx.uid !== state.hostUid) throw new GameError("Tylko host może przejść dalej.", 403);
      if (state.phase === "odsloniecie") return advanceOrFinish(state, ctx.now, ctx.rng);
      if (state.phase === "pomiar") return toReveal(state, ctx.now); // host zamyka rundę wcześniej
      return state;
    }

    // SUBMIT
    if (state.phase !== "pomiar") throw new GameError("Runda już zamknięta.");
    if (!state.playerUids.includes(ctx.uid)) throw new GameError("Nie jesteś w tej rundzie.", 403);
    if (state.results[ctx.uid]) throw new GameError("Już zatrzymałeś stoper w tej rundzie.");
    if (action.valueMs < MIN_VALID_MS) throw new GameError("Za szybko — to był przypadkowy klik?");

    const value = Math.min(action.valueMs, roundLimitMs(state.target));
    const signedMs = value - state.target;
    const errorMs = Math.abs(signedMs);
    // Sanity wg zegara serwera (SPEC §5.2): claim większy niż realny czas od startu rundy.
    const wallClock = ctx.now - state.roundStartedAt;
    const suspicious = value > wallClock + 800;

    const results = { ...state.results, [ctx.uid]: { valueMs: value, errorMs, signedMs, suspicious } };
    const isBust = state.settings.noOvershoot && signedMs > 0;
    const perfectHits =
      errorMs < PERFECT_MS && !isBust ? [...state.perfectHits, ctx.uid] : state.perfectHits;

    const next: StoperState = {
      ...state,
      results,
      perfectHits,
      pendingEvents: [],
    };

    // Wszyscy zatrzymali → od razu odsłonięcie (nie czekamy na limit).
    const allIn = state.playerUids.every((uid) => results[uid]);
    return allIn ? toReveal(next, ctx.now) : next;
  },

  publicView(state, players: PlayerMap) {
    const reveal = state.phase !== "pomiar";
    return {
      mode: "cel",
      round: state.round,
      totalRounds: state.settings.rounds,
      scoring: state.settings.scoring,
      phase: state.phase,
      target: state.target,
      // W pomiarze pokazujemy TYLKO kto już zatrzymał (bez wartości) — wyniki tajne do końca.
      submitted: state.playerUids.filter((uid) => state.results[uid]),
      players: state.playerUids.map((uid) => ({
        uid,
        nick: players[uid]?.nick ?? "?",
        avatar: players[uid]?.avatar ?? "❓",
        score: state.scores[uid] ?? 0,
      })),
      // Odsłonięcie: pełny ranking z wartościami i znakiem błędu.
      reveal: reveal
        ? ranked(state).map((uid) => ({
            uid,
            valueMs: state.results[uid]?.valueMs ?? null,
            errorMs: state.results[uid]?.errorMs ?? null,
            signedMs: state.results[uid]?.signedMs ?? null,
            suspicious: state.results[uid]?.suspicious ?? false,
            perfect: state.perfectHits.includes(uid),
            busted: busted(state, uid),
          }))
        : null,
      perfectHits: reveal ? state.perfectHits : [],
    };
  },

  privateView(state, uid: string) {
    const r = state.results[uid];
    return {
      submitted: !!r,
      myValueMs: r?.valueMs ?? null,
    };
  },

  phase(state) {
    return { name: state.phase, endsAt: state.phaseEndsAt };
  },

  isFinished(state) {
    return state.phase === "koniec";
  },

  scores(state) {
    return state.scores;
  },

  drainEvents(state) {
    return state.pendingEvents;
  },
};
