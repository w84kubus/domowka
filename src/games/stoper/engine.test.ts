import { describe, expect, it } from "vitest";
import { stoperEngine, type StoperState } from "./engine";
import { stoperSettingsSchema, type StoperSettings } from "./manifest";
import { mulberry32 } from "@/games/rng";
import type { Player, PlayerMap } from "@/lib/types/room";

function player(uid: string, isHost = false): Player {
  return { uid, nick: uid, avatar: "🦊", joinedAt: 0, isHost, connected: true, lastSeenAt: 0, totalScore: 0 };
}
const players: PlayerMap = { host: player("host", true), a: player("a"), b: player("b") };

function init(overrides: Partial<StoperSettings> = {}, now = 1000): StoperState {
  const settings = stoperSettingsSchema.parse({ targetMode: "staly", fixedTargetMs: 10000, rounds: 3, ...overrides });
  return stoperEngine.init({
    players,
    seatOrder: ["host", "a", "b"],
    settings,
    now,
    rng: mulberry32(1),
    seed: 1,
  });
}
const ctx = (uid: string, now = 2000) => ({ uid, now, rng: mulberry32(now) });

describe("stoper engine — tryb CEL", () => {
  it("init startuje rundę 1 w fazie pomiar z celem", () => {
    const s = init();
    expect(s.round).toBe(1);
    expect(s.phase).toBe("pomiar");
    expect(s.target).toBe(10000);
    expect(stoperEngine.isFinished(s)).toBe(false);
  });

  it("SUBMIT liczy błąd ze znakiem; za późno = dodatni", () => {
    let s = init();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10300 }, ctx("a"));
    expect(s.results.a.errorMs).toBe(300);
    expect(s.results.a.signedMs).toBe(300); // za późno
  });

  it("odrzuca przypadkowy klik < 50 ms", () => {
    const s = init();
    expect(() => stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 20 }, ctx("a"))).toThrow();
  });

  it("nie można zatrzymać dwa razy", () => {
    let s = init();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9000 }, ctx("a"));
    expect(() => stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9500 }, ctx("a"))).toThrow();
  });

  it("gdy wszyscy zatrzymają → automatyczne odsłonięcie", () => {
    let s = init();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10100 }, ctx("host"));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9800 }, ctx("a"));
    expect(s.phase).toBe("pomiar");
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 12000 }, ctx("b"));
    expect(s.phase).toBe("odsloniecie");
  });

  it("punktacja precyzja: 10/7/5 wg błędu", () => {
    let s = init({ scoring: "precyzja" });
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10500 }, ctx("host")); // błąd 500 → 3. miejsce
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10050 }, ctx("a")); // błąd 50 → 1. miejsce
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10200 }, ctx("b")); // błąd 200 → 2. miejsce
    expect(s.phase).toBe("odsloniecie");
    expect(s.scores.a).toBe(10);
    expect(s.scores.b).toBe(7);
    expect(s.scores.host).toBe(5);
  });

  it("punktacja zwycięstwa: najbliższy +1", () => {
    let s = init({ scoring: "zwyciestwa" });
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10500 }, ctx("host"));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10050 }, ctx("a"));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10200 }, ctx("b"));
    expect(s.scores.a).toBe(1);
    expect(s.scores.b ?? 0).toBe(0);
  });

  it("idealne trafienie (błąd < 50 ms) generuje zdarzenie", () => {
    let s = init();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10010 }, ctx("host"));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10020 }, ctx("a"));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10030 }, ctx("b"));
    expect(s.perfectHits.length).toBe(3);
    expect(stoperEngine.drainEvents(s).some((e) => e.type === "idealnie")).toBe(true);
  });

  it("PHASE_TIMEOUT w pomiarze zamyka rundę (spóźnialscy bez wyniku)", () => {
    let s = init();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9900 }, ctx("a"));
    s = stoperEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 40000));
    expect(s.phase).toBe("odsloniecie");
    const view = stoperEngine.publicView(s, players) as { reveal: { uid: string; valueMs: number | null }[] };
    expect(view.reveal.find((r) => r.uid === "b")?.valueMs).toBeNull();
    expect(view.reveal[0].uid).toBe("a"); // jedyny z wynikiem na czele
  });

  it("tajność: w pomiarze publicView nie ujawnia wartości", () => {
    let s = init();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9900 }, ctx("a"));
    const view = stoperEngine.publicView(s, players) as { reveal: unknown; submitted: string[] };
    expect(view.reveal).toBeNull();
    expect(view.submitted).toContain("a");
  });

  it("NEXT tylko dla hosta", () => {
    let s = init();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9900 }, ctx("host"));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9900 }, ctx("a"));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9900 }, ctx("b")); // → odsłonięcie
    expect(() => stoperEngine.reduce(s, { type: "NEXT" }, ctx("a"))).toThrow();
    const s2 = stoperEngine.reduce(s, { type: "NEXT" }, ctx("host"));
    expect(s2.round).toBe(2);
    expect(s2.phase).toBe("pomiar");
  });

  it("pełna partia 3 rund kończy się w fazie koniec z kumulacją punktów", () => {
    let s = init({ rounds: 3, scoring: "precyzja" });
    for (let r = 1; r <= 3; r++) {
      s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10050 }, ctx("a"));
      s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10200 }, ctx("host"));
      s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10500 }, ctx("b"));
      expect(s.phase).toBe("odsloniecie");
      if (r < 3) s = stoperEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 100000));
    }
    // po 3. rundzie odsłonięcie → PHASE_TIMEOUT → koniec
    s = stoperEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 100000));
    expect(s.phase).toBe("koniec");
    expect(stoperEngine.isFinished(s)).toBe(true);
    expect(stoperEngine.scores(s).a).toBe(30); // 3× 1. miejsce
  });
});
