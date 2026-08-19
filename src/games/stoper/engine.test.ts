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

describe("stoper — nowe ustawienia", () => {
  it("domyślnie runda nie ma terminu (zachowanie jak dotąd)", () => {
    const s = init();
    expect(s.phaseEndsAt).toBeNull();
  });

  it("roundTimeoutMs ustawia termin rundy, więc nie wisi bez STOP-u", () => {
    const s = init({ roundTimeoutMs: 30_000 }, 1000);
    expect(s.phaseEndsAt).toBe(31_000);
  });

  it("PHASE_TIMEOUT po terminie zamyka rundę tym, którzy nie zdążyli", () => {
    let s = init({ roundTimeoutMs: 30_000 }, 1000);
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9800 }, ctx("a", 2000));
    s = stoperEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 31_000));
    expect(s.phase).toBe("odsloniecie");
    expect(s.results.a).toBeDefined();
    expect(s.results.b).toBeUndefined(); // nie zdążył
  });

  it("revealMs steruje długością ekranu wyników", () => {
    let s = init({ revealMs: 15_000 }, 1000);
    for (const uid of ["host", "a", "b"]) {
      s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10_000 }, ctx(uid, 2000));
    }
    expect(s.phase).toBe("odsloniecie");
    expect(s.phaseEndsAt).toBe(2000 + 15_000);
  });

  it("rundy przyjmują nowe wartości 1 i 10", () => {
    expect(stoperSettingsSchema.parse({ rounds: 1 }).rounds).toBe(1);
    expect(stoperSettingsSchema.parse({ rounds: 10 }).rounds).toBe(10);
  });
});

describe("stoper — wariant bez przekroczenia", () => {
  const overshoot = (o = {}) => init({ noOvershoot: true, scoring: "zwyciestwa", ...o });

  it("przekroczenie celu nie punktuje, mimo mniejszego błędu", () => {
    let s = overshoot();
    // a przekracza o 100 ms (błąd mniejszy), b jest 500 ms przed celem
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10_100 }, ctx("a", 2000));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9_500 }, ctx("b", 2000));
    s = stoperEngine.reduce(s, { type: "NEXT" }, ctx("host", 3000));
    expect(s.phase).toBe("odsloniecie");
    expect(s.scores.b).toBe(1); // wygrywa mimo większego błędu
    expect(s.scores.a ?? 0).toBe(0); // spalony
  });

  it("spalony ląduje w rankingu za tymi z ważnym wynikiem, ale przed tymi bez wyniku", () => {
    let s = overshoot();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10_100 }, ctx("a", 2000)); // spalony
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9_000 }, ctx("b", 2000)); // ważny
    s = stoperEngine.reduce(s, { type: "NEXT" }, ctx("host", 3000));
    const view = stoperEngine.publicView(s, players) as {
      reveal: { uid: string; busted: boolean }[];
    };
    expect(view.reveal.map((r) => r.uid)).toEqual(["b", "a", "host"]);
    expect(view.reveal.find((r) => r.uid === "a")!.busted).toBe(true);
    expect(view.reveal.find((r) => r.uid === "b")!.busted).toBe(false);
  });

  it("spalony nie dostaje idealnego trafienia", () => {
    let s = overshoot();
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10_010 }, ctx("a", 2000)); // +10 ms
    expect(s.perfectHits).not.toContain("a");
  });

  it("bez wariantu przekroczenie liczy się normalnie", () => {
    let s = init({ scoring: "zwyciestwa" });
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 10_100 }, ctx("a", 2000));
    s = stoperEngine.reduce(s, { type: "SUBMIT", valueMs: 9_500 }, ctx("b", 2000));
    s = stoperEngine.reduce(s, { type: "NEXT" }, ctx("host", 3000));
    expect(s.scores.a).toBe(1); // mniejszy błąd wygrywa
  });
});

describe("stoper — tryb B ZGADNIJ CZAS", () => {
  const initB = (o: Partial<StoperSettings> = {}) => init({ mode: "zgadnij", rounds: 3, ...o });
  const pub = (s: StoperState) =>
    stoperEngine.publicView(s, players) as Record<string, unknown> & {
      actualMs: number | null;
      target: number;
      runnerUid: string | null;
      guessed: string[];
    };

  it("startuje w oczekiwaniu, Biegacz to pierwszy z seatOrder", () => {
    const s = initB();
    expect(s.phase).toBe("oczekiwanie");
    expect(s.runnerUid).toBe("host");
    expect(s.actualMs).toBeNull();
  });

  it("Biegacz rotuje co rundę wg seatOrder", () => {
    let s = initB();
    const kolejni: (string | null)[] = [s.runnerUid];
    for (let i = 0; i < 2; i++) {
      s = stoperEngine.reduce(s, { type: "RUN_START" }, ctx(s.runnerUid!, 2000));
      s = stoperEngine.reduce(s, { type: "RUN_STOP", valueMs: 5000 }, ctx(s.runnerUid!, 7000));
      for (const uid of ["host", "a", "b"]) {
        s = stoperEngine.reduce(s, { type: "GUESS", valueMs: 5000 }, ctx(uid, 8000));
      }
      s = stoperEngine.reduce(s, { type: "NEXT" }, ctx("host", 9000));
      kolejni.push(s.runnerUid);
    }
    expect(kolejni).toEqual(["host", "a", "b"]);
  });

  it("tylko Biegacz może wystartować i zatrzymać", () => {
    let s = initB();
    expect(() => stoperEngine.reduce(s, { type: "RUN_START" }, ctx("a", 2000))).toThrow();
    s = stoperEngine.reduce(s, { type: "RUN_START" }, ctx("host", 2000));
    expect(s.phase).toBe("bieg");
    expect(() => stoperEngine.reduce(s, { type: "RUN_STOP", valueMs: 5000 }, ctx("b", 7000))).toThrow();
  });

  it("BEZPIECZEŃSTWO: zmierzony czas nie wycieka do publicState przed odsłonięciem", () => {
    let s = initB();
    s = stoperEngine.reduce(s, { type: "RUN_START" }, ctx("host", 2000));
    s = stoperEngine.reduce(s, { type: "RUN_STOP", valueMs: 7345 }, ctx("host", 9345));
    expect(s.actualMs).toBe(7345); // silnik zna

    const widok = pub(s);
    expect(widok.actualMs).toBeNull(); // klient NIE zna
    expect(widok.target).toBe(0);
    expect(JSON.stringify(widok)).not.toContain("7345");
  });

  it("BEZPIECZEŃSTWO: cudze typy nie wyciekają przed odsłonięciem", () => {
    let s = initB();
    s = stoperEngine.reduce(s, { type: "RUN_START" }, ctx("host", 2000));
    s = stoperEngine.reduce(s, { type: "RUN_STOP", valueMs: 5000 }, ctx("host", 7000));
    s = stoperEngine.reduce(s, { type: "GUESS", valueMs: 4321 }, ctx("a", 8000));

    const widok = pub(s);
    expect(widok.guessed).toEqual(["a"]); // wiadomo ŻE zgadł
    expect(JSON.stringify(widok)).not.toContain("4321"); // ale nie CO
  });

  it("gracz widzi własny typ w private, ale nie cudze", () => {
    let s = initB();
    s = stoperEngine.reduce(s, { type: "RUN_START" }, ctx("host", 2000));
    s = stoperEngine.reduce(s, { type: "RUN_STOP", valueMs: 5000 }, ctx("host", 7000));
    s = stoperEngine.reduce(s, { type: "GUESS", valueMs: 4321 }, ctx("a", 8000));
    const priv = stoperEngine.privateView(s, "a") as { myGuessMs: number | null };
    const privB = stoperEngine.privateView(s, "b") as { myGuessMs: number | null };
    expect(priv.myGuessMs).toBe(4321);
    expect(privB.myGuessMs).toBeNull();
  });

  it("po typach wszystkich odsłania czas i punktuje wg błędu", () => {
    let s = initB({ scoring: "zwyciestwa" });
    s = stoperEngine.reduce(s, { type: "RUN_START" }, ctx("host", 2000));
    s = stoperEngine.reduce(s, { type: "RUN_STOP", valueMs: 6000 }, ctx("host", 8000));
    s = stoperEngine.reduce(s, { type: "GUESS", valueMs: 6100 }, ctx("host", 9000)); // błąd 100
    s = stoperEngine.reduce(s, { type: "GUESS", valueMs: 5000 }, ctx("a", 9000));    // błąd 1000
    expect(s.phase).toBe("typowanie"); // b jeszcze nie
    s = stoperEngine.reduce(s, { type: "GUESS", valueMs: 6010 }, ctx("b", 9000));    // błąd 10

    expect(s.phase).toBe("odsloniecie");
    const widok = pub(s);
    expect(widok.actualMs).toBe(6000); // dopiero teraz jawny
    expect(s.scores.b).toBe(1); // najbliżej
    expect(s.scores.host ?? 0).toBe(0);
  });

  it("nie da się zgadywać dwa razy ani przed zatrzymaniem biegu", () => {
    let s = initB();
    expect(() => stoperEngine.reduce(s, { type: "GUESS", valueMs: 1000 }, ctx("a", 2000))).toThrow();
    s = stoperEngine.reduce(s, { type: "RUN_START" }, ctx("host", 2000));
    s = stoperEngine.reduce(s, { type: "RUN_STOP", valueMs: 5000 }, ctx("host", 7000));
    s = stoperEngine.reduce(s, { type: "GUESS", valueMs: 4000 }, ctx("a", 8000));
    expect(() => stoperEngine.reduce(s, { type: "GUESS", valueMs: 4500 }, ctx("a", 8100))).toThrow();
  });

  it("tryb A działa bez zmian (regresja)", () => {
    const s = init();
    expect(s.phase).toBe("pomiar");
    expect(s.runnerUid).toBeNull();
    expect((stoperEngine.publicView(s, players) as { mode: string }).mode).toBe("cel");
  });
});
