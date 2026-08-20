import { z } from "zod";
import type { PlayerMap } from "@/lib/types/room";
import { GameError, type GameEngine, type GameEvent, type InitContext, type WithEvents } from "@/games/types";
import { shuffle } from "@/games/rng";
import { narratorLine } from "./data/narrator";
import { autoMafiaCount, type MafiaSettings } from "./manifest";

// Mafia — rdzeń (SPEC §5.6): mafia, mieszkańcy, detektyw, lekarz + auto-narrator.
// BEZPIECZEŃSTWO: role żyją tylko w secret/state i private/{uid}. publicView ujawnia rolę
// wyłącznie zmarłych (jeśli włączone) i wszystkich na końcu.

export type Role = "mafia" | "mieszkaniec" | "detektyw" | "lekarz";
type Phase = "rozdanie" | "noc" | "switt" | "dzien" | "glosowanie" | "koniec";

const NIGHT_MS = 30000;
const VOTE_MS = 60000;
const SWITT_MS = 7000;

export interface MafiaState extends WithEvents {
  settings: MafiaSettings;
  hostUid: string;
  playerUids: string[];
  roles: Record<string, Role>;
  alive: Record<string, boolean>;
  phase: Phase;
  phaseEndsAt: number | null;
  night: number;
  confirmed: string[];
  mafiaVotes: Record<string, string>;
  doctorSave: string | null;
  detectiveCheck: string | null;
  lastDoctorSave: string | null;
  detectiveHistory: Record<string, { target: string; isMafia: boolean }[]>;
  votes: Record<string, string>;
  deaths: string[];
  revealed: Record<string, Role>;
  afterReveal: "dzien" | "noc";
  narrator: string;
  /** Klucz tłumaczenia kwestii narratora; UI woli go od `narrator` (polski zapas). */
  narratorKey: string | null;
  winner: "miasto" | "mafia" | null;
  scores: Record<string, number>;
}

export const mafiaActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CONFIRM") }),
  z.object({ type: z.literal("MAFIA_KILL"), target: z.string() }),
  z.object({ type: z.literal("INVESTIGATE"), target: z.string() }),
  z.object({ type: z.literal("PROTECT"), target: z.string() }),
  z.object({ type: z.literal("VOTE"), target: z.string() }),
  z.object({ type: z.literal("NEXT") }),
  z.object({ type: z.literal("FINISH") }), // host: zakończ grę (tryb rund „∞")
]);
export type MafiaAction = z.infer<typeof mafiaActionSchema>;

// —— pomocnicze selektory ——
const aliveOf = (s: MafiaState, role: Role) => s.playerUids.filter((u) => s.alive[u] && s.roles[u] === role);
const firstAlive = (s: MafiaState, role: Role) => aliveOf(s, role)[0] ?? null;
function countFactions(s: MafiaState) {
  let mafia = 0, inni = 0;
  for (const u of s.playerUids) {
    if (!s.alive[u]) continue;
    if (s.roles[u] === "mafia") mafia++;
    else inni++;
  }
  return { mafia, inni };
}
function checkWin(s: MafiaState): "miasto" | "mafia" | null {
  const { mafia, inni } = countFactions(s);
  if (mafia === 0) return "miasto";
  if (mafia >= inni) return "mafia"; // mafiozi ≥ pozostali żywi (SPEC §5.6)
  return null;
}

// —— rozliczenie nocy: CZYSTE (SPEC §5.6.3, DoD §10) ——
export function resolveNight(s: MafiaState): { deaths: string[]; detective: { target: string; isMafia: boolean } | null } {
  // cel mafii = większość głosów żywych mafiozów; remis → głos pierwszego z listy
  const mafiozi = aliveOf(s, "mafia");
  const tally: Record<string, number> = {};
  for (const m of mafiozi) { const t = s.mafiaVotes[m]; if (t) tally[t] = (tally[t] ?? 0) + 1; }
  let target: string | null = null, max = 0;
  for (const [t, n] of Object.entries(tally)) if (n > max) { max = n; target = t; }
  const top = Object.keys(tally).filter((t) => tally[t] === max);
  if (top.length > 1) for (const m of mafiozi) if (s.mafiaVotes[m] && top.includes(s.mafiaVotes[m])) { target = s.mafiaVotes[m]; break; }

  // lekarz anuluje zabójstwo, jeśli chronił cel
  const deaths = target && s.doctorSave !== target ? [target] : [];

  const detective = s.detectiveCheck
    ? { target: s.detectiveCheck, isMafia: s.roles[s.detectiveCheck] === "mafia" }
    : null;
  return { deaths, detective };
}

function assignRoles(playerUids: string[], settings: MafiaSettings, rng: () => number): Record<string, Role> {
  const n = playerUids.length;
  const mafiaCount = settings.mafiaCount > 0 ? Math.min(settings.mafiaCount, n - 1) : autoMafiaCount(n);
  const shuffled = shuffle(playerUids, rng);
  const roles: Record<string, Role> = {};
  let i = 0;
  for (; i < mafiaCount; i++) roles[shuffled[i]] = "mafia";
  if (i < n) roles[shuffled[i++]] = "detektyw";
  if (i < n) roles[shuffled[i++]] = "lekarz";
  for (; i < n; i++) roles[shuffled[i]] = "mieszkaniec";
  return roles;
}

function startNight(s: MafiaState, now: number, rng: () => number): MafiaState {
  return {
    ...s,
    phase: "noc",
    night: s.night + 1,
    phaseEndsAt: now + NIGHT_MS,
    mafiaVotes: {},
    doctorSave: null,
    detectiveCheck: null,
    deaths: [],
    ...(({ text, key }) => ({ narrator: text, narratorKey: key }))(narratorLine("noc", rng)),
    pendingEvents: [{ type: "noc", text: `Noc ${s.night + 1}. Miasto zasypia.` }],
  };
}

function nightComplete(s: MafiaState): boolean {
  const mafiaActed = aliveOf(s, "mafia").every((m) => s.mafiaVotes[m]);
  const det = firstAlive(s, "detektyw");
  const lek = firstAlive(s, "lekarz");
  return mafiaActed && (!det || s.detectiveCheck != null) && (!lek || s.doctorSave != null);
}

function toReveal(s: MafiaState, deaths: string[], after: "dzien" | "noc", now: number, rng: () => number): MafiaState {
  const alive = { ...s.alive };
  const revealed = { ...s.revealed };
  for (const d of deaths) { alive[d] = false; if (s.settings.revealRoles) revealed[d] = s.roles[d]; }
  const next: MafiaState = { ...s, alive, revealed, deaths };
  const winner = checkWin(next);
  if (winner) return toKoniec(next, winner);
  return {
    ...next,
    phase: "switt",
    afterReveal: after,
    phaseEndsAt: now + SWITT_MS,
    ...(({ text, key }) => ({ narrator: text, narratorKey: key }))(narratorLine(after === "dzien" ? "switt" : "smierc", rng)),
    pendingEvents: deaths.length
      ? deaths.map((d) => ({ type: "smierc", text: "Ktoś nie doczekał świtu…", meta: { uid: d } }))
      : [{ type: "spokoj", text: "Noc minęła spokojnie." }],
  };
}

function toKoniec(s: MafiaState, winner: "miasto" | "mafia"): MafiaState {
  const scores = { ...s.scores };
  for (const u of s.playerUids) {
    const win = winner === "mafia" ? s.roles[u] === "mafia" : s.roles[u] !== "mafia";
    if (win) scores[u] = (scores[u] ?? 0) + 1;
  }
  const zyjacaMafia = s.playerUids.filter((u) => s.alive[u] && s.roles[u] === "mafia");
  return {
    ...s,
    phase: "koniec",
    winner,
    phaseEndsAt: null,
    revealed: { ...s.roles }, // na końcu odsłaniamy wszystkie role
    scores,
    narrator: winner === "mafia" ? "Mafia przejęła miasto." : "Miasto oczyszczone. Mafia pokonana.",
    narratorKey: winner === "mafia" ? "mafia.narrator.winMafia" : "mafia.narrator.winTown",
    pendingEvents: [
      { type: "koniec", text: winner === "mafia" ? "Mafia wygrywa!" : "Miasto wygrywa!" },
      // Ostatni żyjący mafioso dowiózł wygraną sam — wyczyn wart zapamiętania.
      // meta.rekord === true → rdzeń dopisuje do „Rekordów pokoju" (UPGRADE.md §8).
      ...(winner === "mafia" && zyjacaMafia.length === 1
        ? [{
            type: "rekord",
            text: "Wygrał dla mafii w pojedynkę",
            key: "feat.mafia.solo",
            meta: { uid: zyjacaMafia[0], rekord: true },
          }]
        : []),
    ],
  };
}

function toDay(s: MafiaState, now: number, rng: () => number): MafiaState {
  const ms = s.settings.discussionMs;
  return { ...s, phase: "dzien", phaseEndsAt: ms ? now + ms : null, deaths: [], ...(({ text, key }) => ({ narrator: text, narratorKey: key }))(narratorLine("dzien", rng)), pendingEvents: [] };
}
function toVoting(s: MafiaState, now: number, rng: () => number): MafiaState {
  return { ...s, phase: "glosowanie", votes: {}, phaseEndsAt: now + VOTE_MS, ...(({ text, key }) => ({ narrator: text, narratorKey: key }))(narratorLine("glosowanie", rng)), pendingEvents: [] };
}

function resolveVote(s: MafiaState, now: number, rng: () => number): MafiaState {
  const tally: Record<string, number> = {};
  for (const t of Object.values(s.votes)) if (t !== "nikt") tally[t] = (tally[t] ?? 0) + 1;
  let target: string | null = null, max = 0, tie = false;
  for (const [t, n] of Object.entries(tally)) { if (n > max) { max = n; target = t; tie = false; } else if (n === max) tie = true; }
  if (!target || tie) {
    // remis / nikt → nikt nie ginie, wracamy do nocy
    return startNight({ ...s, deaths: [] }, now, rng);
  }
  return toReveal(s, [target], "noc", now, rng);
}

function requireHost(s: MafiaState, uid: string) {
  if (uid !== s.hostUid) throw new GameError("Tylko host.", 403);
}
function requireAliveRole(s: MafiaState, uid: string, role: Role) {
  if (!s.alive[uid] || s.roles[uid] !== role) throw new GameError("Nie możesz teraz działać.", 403);
}
function requireAliveTarget(s: MafiaState, target: string) {
  if (!s.playerUids.includes(target) || !s.alive[target]) throw new GameError("Cel nie żyje albo nie istnieje.");
}

export const mafiaEngine: GameEngine<MafiaState, MafiaAction, MafiaSettings> = {
  id: "mafia",
  actionSchema: mafiaActionSchema,

  init(ctx: InitContext<MafiaSettings>): MafiaState {
    const hostUid = Object.values(ctx.players).find((p) => p.isHost)?.uid ?? ctx.seatOrder[0];
    const playerUids = ctx.seatOrder.length ? ctx.seatOrder : Object.keys(ctx.players);
    const roles = assignRoles(playerUids, ctx.settings, ctx.rng);
    const alive: Record<string, boolean> = {};
    for (const u of playerUids) alive[u] = true;
    return {
      settings: ctx.settings, hostUid, playerUids, roles, alive,
      phase: "rozdanie", phaseEndsAt: null, night: 0, confirmed: [], narratorKey: null,
      mafiaVotes: {}, doctorSave: null, detectiveCheck: null, lastDoctorSave: null,
      detectiveHistory: {}, votes: {}, deaths: [], revealed: {}, afterReveal: "dzien",
      narrator: "Rozdanie ról… zapamiętajcie, kim jesteście.", winner: null, scores: {},
      pendingEvents: [{ type: "start", text: "Role rozdane." }],
    };
  },

  reduce(state, action, ctx): MafiaState {
    if (action.type === "PHASE_TIMEOUT") {
      if (state.phase === "noc") { const r = resolveNight(state); return applyNight(state, r, ctx.now, ctx.rng); }
      if (state.phase === "switt") return state.afterReveal === "dzien" ? toDay(state, ctx.now, ctx.rng) : startNight(state, ctx.now, ctx.rng);
      if (state.phase === "dzien") return toVoting(state, ctx.now, ctx.rng);
      if (state.phase === "glosowanie") return resolveVote(state, ctx.now, ctx.rng);
      return state;
    }

    if (action.type === "FINISH") {
      requireHost(state, ctx.uid);
      // Kończy natychmiast, z dotychczasową punktacją. Bez tego przy rundach „∞"
      // jedynym wyjściem było przerwanie partii, które nie zapisuje rekordów.
      if (state.phase === "koniec") return state;
      return {
        ...state,
        phase: "koniec",
        phaseEndsAt: null,
        pendingEvents: [...(state.pendingEvents ?? []), { type: "koniec", text: "Koniec gry!" }],
      };
    }

    if (action.type === "NEXT") {
      requireHost(state, ctx.uid);
      if (state.phase === "switt") return state.afterReveal === "dzien" ? toDay(state, ctx.now, ctx.rng) : startNight(state, ctx.now, ctx.rng);
      if (state.phase === "dzien") return toVoting(state, ctx.now, ctx.rng);
      if (state.phase === "noc") { const r = resolveNight(state); return applyNight(state, r, ctx.now, ctx.rng); }
      return state;
    }

    if (action.type === "CONFIRM") {
      if (state.phase !== "rozdanie") throw new GameError("Nie ta faza.");
      if (state.confirmed.includes(ctx.uid)) return state;
      const confirmed = [...state.confirmed, ctx.uid];
      if (confirmed.length >= state.playerUids.length) return startNight({ ...state, confirmed }, ctx.now, ctx.rng);
      return { ...state, confirmed, pendingEvents: [] };
    }

    if (action.type === "MAFIA_KILL") {
      if (state.phase !== "noc") throw new GameError("Nie ta faza.");
      requireAliveRole(state, ctx.uid, "mafia");
      requireAliveTarget(state, action.target);
      if (state.roles[action.target] === "mafia") throw new GameError("Nie zabijasz swoich.");
      const next = { ...state, mafiaVotes: { ...state.mafiaVotes, [ctx.uid]: action.target }, pendingEvents: [] };
      return nightComplete(next) ? applyNight(next, resolveNight(next), ctx.now, ctx.rng) : next;
    }

    if (action.type === "INVESTIGATE") {
      if (state.phase !== "noc") throw new GameError("Nie ta faza.");
      requireAliveRole(state, ctx.uid, "detektyw");
      requireAliveTarget(state, action.target);
      const next = { ...state, detectiveCheck: action.target, pendingEvents: [] };
      return nightComplete(next) ? applyNight(next, resolveNight(next), ctx.now, ctx.rng) : next;
    }

    if (action.type === "PROTECT") {
      if (state.phase !== "noc") throw new GameError("Nie ta faza.");
      requireAliveRole(state, ctx.uid, "lekarz");
      requireAliveTarget(state, action.target);
      if (!state.settings.doctorSelfSave && action.target === ctx.uid) throw new GameError("Nie możesz ratować siebie.");
      if (state.settings.doctorNoRepeat && action.target === state.lastDoctorSave) throw new GameError("Nie ratujesz tej samej osoby dwa razy z rzędu.");
      const next = { ...state, doctorSave: action.target, pendingEvents: [] };
      return nightComplete(next) ? applyNight(next, resolveNight(next), ctx.now, ctx.rng) : next;
    }

    if (action.type === "VOTE") {
      if (state.phase !== "glosowanie") throw new GameError("Nie ta faza.");
      if (!state.alive[ctx.uid]) throw new GameError("Martwi nie głosują.", 403);
      if (action.target !== "nikt") requireAliveTarget(state, action.target);
      const votes = { ...state.votes, [ctx.uid]: action.target };
      const aliveVoters = state.playerUids.filter((u) => state.alive[u]);
      if (aliveVoters.every((u) => votes[u])) return resolveVote({ ...state, votes }, ctx.now, ctx.rng);
      return { ...state, votes, pendingEvents: [] };
    }

    return state;
  },

  publicView(state, players: PlayerMap) {
    const reveal = state.phase === "koniec";
    const view = state.playerUids.map((uid) => ({
      uid, nick: players[uid]?.nick ?? "?", avatar: players[uid]?.avatar ?? "❓",
      alive: state.alive[uid], confirmed: state.confirmed.includes(uid),
      voted: state.votes[uid] != null,
      role: reveal || state.revealed[uid] ? (state.revealed[uid] ?? state.roles[uid]) : null,
      score: state.scores[uid] ?? 0,
    }));
    return {
      // Rdzeń pokazuje „Zakończ grę" zamiast awaryjnego przerwania (patrz GameShell).
      canFinish: state.phase === "switt",
      phase: state.phase, night: state.night, narrator: state.narrator, narratorKey: state.narratorKey,
      deaths: state.deaths, winner: state.winner, afterReveal: state.afterReveal,
      players: view,
      votesTally: state.phase === "glosowanie" && !state.settings.secretVoting
        ? Object.values(state.votes).reduce<Record<string, number>>((a, t) => ((a[t] = (a[t] ?? 0) + 1), a), {})
        : {},
      aliveCount: state.playerUids.filter((u) => state.alive[u]).length,
    };
  },

  privateView(state, uid: string) {
    const role = state.roles[uid];
    if (!role) return {};
    const base: Record<string, unknown> = { role, alive: state.alive[uid] };
    if (role === "mafia") {
      base.mafia = state.playerUids.filter((u) => state.roles[u] === "mafia");
      base.mafiaVotes = state.mafiaVotes; // mafiozi widzą swoje głosy na żywo
      base.acted = state.mafiaVotes[uid] != null;
    }
    if (role === "detektyw") {
      base.checks = state.detectiveHistory[uid] ?? [];
      base.acted = state.detectiveCheck != null;
    }
    if (role === "lekarz") base.acted = state.doctorSave != null;
    return base;
  },

  phase(state) { return { name: state.phase, endsAt: state.phaseEndsAt }; },
  isFinished(state) { return state.phase === "koniec"; },
  scores(state) { return state.scores; },
  drainEvents(state): GameEvent[] { return state.pendingEvents; },
};

// zastosuj wynik rozliczenia nocy: zapisz historię detektywa, zabij, sprawdź wygraną
function applyNight(s: MafiaState, r: { deaths: string[]; detective: { target: string; isMafia: boolean } | null }, now: number, rng: () => number): MafiaState {
  let st = s;
  if (r.detective) {
    const det = firstAlive(s, "detektyw");
    if (det) st = { ...st, detectiveHistory: { ...st.detectiveHistory, [det]: [...(st.detectiveHistory[det] ?? []), r.detective] } };
  }
  st = { ...st, lastDoctorSave: st.doctorSave };
  return toReveal(st, r.deaths, "dzien", now, rng);
}
