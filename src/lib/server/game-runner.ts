import "server-only";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { ApiError } from "./auth";
import { GAMES } from "@/games/registry";
import { mulberry32, randomSeed, shuffle } from "@/games/rng";
import { GameError, type GameEngine } from "@/games/types";
import type { Room } from "@/lib/types/room";

// Runner gier (SPEC §3.1): JEDYNE miejsce, gdzie zapisuje się stan gry. Klient nigdy nie pisze.
// Każda akcja: zweryfikuj → uruchom czysty reducer → zapisz public/private/secret/events.

interface SecretState {
  fullState: unknown;
  seed: number;
}

function getGame(gameId: string) {
  const g = GAMES[gameId];
  if (!g) throw new ApiError(400, "Nieznana gra.");
  return g;
}

/**
 * Zapisuje nowy stan silnika do Firestore w ramach transakcji:
 * publicState (dla wszystkich), private/{uid} (tajemnice), secret/state (pełny stan + seed),
 * events (feed), oraz metadane fazy i wersję (optimistic lock).
 */
function persist(
  t: Transaction,
  ref: FirebaseFirestore.DocumentReference,
  room: Room,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: GameEngine<any, any, any>,
  state: unknown,
  seed: number,
  now: number,
) {
  const players = room.players;
  const phase = engine.phase(state);
  const events = engine.drainEvents(state);
  const finished = engine.isFinished(state);
  const scores = engine.scores(state);

  // Bufor zdarzeń nie może zostać w trwałym stanie — czyścimy przed zapisem (SPEC §3.4).
  const cleanState =
    state && typeof state === "object"
      ? { ...(state as Record<string, unknown>), pendingEvents: [] }
      : state;

  const phaseChanged = phase.name !== room.phase;

  const update: Record<string, unknown> = {
    publicState: engine.publicView(state, players),
    phase: phase.name,
    phaseEndsAt: phase.endsAt,
    phaseStartedAt: phaseChanged ? now : (room.phaseStartedAt ?? now),
    status: finished ? "finished" : "playing",
    version: room.version + 1,
  };

  t.set(ref.collection("secret").doc("state"), { fullState: cleanState, seed });

  for (const uid of Object.keys(players)) {
    t.set(ref.collection("private").doc(uid), { payload: engine.privateView(state, uid) ?? null });
  }

  for (const ev of events) {
    t.set(ref.collection("events").doc(), {
      at: FieldValue.serverTimestamp(),
      type: ev.type,
      text: ev.text,
      meta: ev.meta ?? {},
    });
  }

  // Na koniec gry doliczamy wynik do totalScore (SPEC §3.2).
  if (finished) {
    for (const [uid, score] of Object.entries(scores)) {
      if (players[uid]) update[`players.${uid}.totalScore`] = FieldValue.increment(score);
    }
  }

  t.update(ref, update);
}

/** Host startuje grę: losuje seatOrder i seed, uruchamia init, zapisuje pełny stan. */
export async function startGame(
  code: string,
  hostUid: string,
  gameId: string,
  rawSettings: unknown,
  now: number,
) {
  const db = getAdminDb();
  const ref = db.doc(`rooms/${code}`);
  const { engine, manifest } = getGame(gameId);

  await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    if (!snap.exists) throw new ApiError(404, "Nie ma pokoju.");
    const room = snap.data() as Room;

    if (room.hostUid !== hostUid) throw new ApiError(403, "Tylko host może zacząć grę.");
    if (room.status !== "lobby") throw new ApiError(409, "Gra już trwa.");

    const count = Object.keys(room.players).length;
    if (count < manifest.minPlayers)
      throw new ApiError(409, `Za mało graczy — potrzeba min. ${manifest.minPlayers}.`);
    if (count > manifest.maxPlayers)
      throw new ApiError(409, `Za dużo graczy — max ${manifest.maxPlayers}.`);

    const settings = manifest.settingsSchema.parse(rawSettings ?? manifest.defaultSettings);
    const seed = randomSeed();
    const rng = mulberry32(seed);
    const seatOrder = shuffle(Object.keys(room.players), rng);

    const state = engine.init({ players: room.players, seatOrder, settings, now, rng, seed });

    t.update(ref, { gameId, settings, seatOrder, round: 0, narratorUid: room.narratorUid ?? null });
    persist(t, ref, { ...room, seatOrder, phase: "" }, engine, state, seed, now);
  });
}

/** Zwykła akcja gracza z klienta. */
export async function applyAction(code: string, uid: string, rawAction: unknown, now: number) {
  const db = getAdminDb();
  const ref = db.doc(`rooms/${code}`);

  await db.runTransaction(async (t) => {
    const [roomSnap, secretSnap] = await Promise.all([
      t.get(ref),
      t.get(ref.collection("secret").doc("state")),
    ]);
    if (!roomSnap.exists) throw new ApiError(404, "Nie ma pokoju.");
    const room = roomSnap.data() as Room;
    if (room.status !== "playing" || !room.gameId) throw new ApiError(409, "Gra nie trwa.");
    if (!room.players[uid]) throw new ApiError(403, "Nie jesteś w tej grze.");

    const { engine } = getGame(room.gameId);
    const secret = secretSnap.data() as SecretState;
    const action = engine.actionSchema.parse(rawAction);
    // rng odtwarzalne z (seed, version): deterministyczne i różne per akcja (SPEC §3.4).
    const rng = mulberry32((secret.seed + room.version) >>> 0);

    let next: unknown;
    try {
      next = engine.reduce(secret.fullState, action, { uid, now, rng });
    } catch (err) {
      if (err instanceof GameError) throw new ApiError(err.status, err.message);
      throw err;
    }
    persist(t, ref, room, engine, next, secret.seed, now);
  });
}

/** Tick fazy (SPEC §3.5): jeśli phaseEndsAt minął wg zegara SERWERA — odpal PHASE_TIMEOUT. */
export async function tickGame(code: string, now: number): Promise<boolean> {
  const db = getAdminDb();
  const ref = db.doc(`rooms/${code}`);

  return db.runTransaction(async (t) => {
    const [roomSnap, secretSnap] = await Promise.all([
      t.get(ref),
      t.get(ref.collection("secret").doc("state")),
    ]);
    if (!roomSnap.exists) return false;
    const room = roomSnap.data() as Room;
    if (room.status !== "playing" || !room.gameId) return false;
    if (room.phaseEndsAt == null || now < room.phaseEndsAt) return false; // jeszcze nie czas

    const { engine } = getGame(room.gameId);
    const secret = secretSnap.data() as SecretState;
    const rng = mulberry32((secret.seed + room.version) >>> 0);
    const next = engine.reduce(secret.fullState, { type: "PHASE_TIMEOUT" }, {
      uid: "__system__",
      now,
      rng,
    });
    persist(t, ref, room, engine, next, secret.seed, now);
    return true;
  });
}
