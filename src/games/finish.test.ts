import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/games/rng";
import { GAMES } from "@/games/registry";
import type { Player, PlayerMap } from "@/lib/types/room";

// „Zakończ grę" jest wspólnym kontraktem rdzenia (GameShell renderuje jeden przycisk dla
// wszystkich gier), więc testujemy go wspólnie dla całego rejestru. Nowa gra dołącza do
// tych testów automatycznie — i od razu wiadomo, czy spełnia kontrakt.

const uids = ["host", "a", "b", "c", "d", "e"];
const players: PlayerMap = Object.fromEntries(
  uids.map((u) => [
    u,
    { uid: u, nick: u, avatar: "cat", joinedAt: 0, isHost: u === "host", connected: true, lastSeenAt: 0, totalScore: 0 } as Player,
  ]),
);
const ctx = (uid: string) => ({ uid, now: 5000, rng: mulberry32(7) });

describe.each(Object.values(GAMES))("$manifest.id — kontrakt zakończenia gry", ({ manifest, engine }) => {
  const start = () =>
    engine.init({ players, seatOrder: uids, settings: manifest.defaultSettings, now: 1000, rng: mulberry32(1), seed: 1 });

  it("host kończy grę akcją FINISH", () => {
    const done = engine.reduce(start(), { type: "FINISH" }, ctx("host"));
    expect(engine.isFinished(done)).toBe(true);
  });

  it("zwykły gracz nie może zakończyć gry", () => {
    expect(() => engine.reduce(start(), { type: "FINISH" }, ctx("a"))).toThrow();
  });

  it("FINISH jest idempotentny — powtórzenie nie psuje stanu", () => {
    const once = engine.reduce(start(), { type: "FINISH" }, ctx("host"));
    const twice = engine.reduce(once, { type: "FINISH" }, ctx("host"));
    expect(engine.isFinished(twice)).toBe(true);
  });

  it("schemat akcji akceptuje FINISH", () => {
    expect(engine.actionSchema.safeParse({ type: "FINISH" }).success).toBe(true);
  });

  it("publicView wystawia canFinish jako boolean w każdej fazie", () => {
    const view = engine.publicView(start(), players) as { canFinish?: unknown };
    expect(typeof view.canFinish).toBe("boolean");
  });

  it("po zakończeniu publicView nie zaprasza już do kończenia", () => {
    const done = engine.reduce(start(), { type: "FINISH" }, ctx("host"));
    const view = engine.publicView(done, players) as { canFinish?: unknown };
    expect(view.canFinish).toBe(false);
  });
});
