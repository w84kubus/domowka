import { describe, expect, it } from "vitest";
import { kasynoEngine, type KasynoState } from "./engine";
import { kasynoSettingsSchema, type KasynoSettings } from "./manifest";
import {
  anteFor, doubleColourOf, DOUBLE_PAYOUT, DOUBLE_SLOTS,
  slotPayout, SLOT_SYMBOLS, WHEEL_SEGMENTS, WHEEL_TOTAL_WEIGHT,
} from "./tables";
import type { PlayerMap } from "@/lib/types/room";

const uids = ["host", "a", "b"];
const players: PlayerMap = Object.fromEntries(
  uids.map((uid) => [uid, { uid, nick: uid, avatar: "cat", joinedAt: 0, isHost: uid === "host", connected: true, lastSeenAt: 0, totalScore: 0 }]),
);

const ctx = (uid: string, now = 1000, rng: () => number = () => 0.42) => ({ uid, now, rng, seed: 1 });

function game(over: Partial<KasynoSettings> = {}) {
  return kasynoEngine.init({
    settings: kasynoSettingsSchema.parse(over), players, seatOrder: uids, now: 0, rng: () => 0.42, seed: 1,
  });
}

describe("kasyno — matematyka wypłat", () => {
  it("Double: 15 pól, jedno zielone, po siedem czerwonych i czarnych", () => {
    const kolory = Array.from({ length: DOUBLE_SLOTS }, (_, i) => doubleColourOf(i));
    expect(kolory.filter((c) => c === "green")).toHaveLength(1);
    expect(kolory.filter((c) => c === "red")).toHaveLength(7);
    expect(kolory.filter((c) => c === "black")).toHaveLength(7);
  });

  it("Double: kolor i zielone mają IDENTYCZNĄ wartość oczekiwaną", () => {
    const evKolor = (7 / 15) * DOUBLE_PAYOUT.red;
    const evZielone = (1 / 15) * DOUBLE_PAYOUT.green;
    expect(evKolor).toBeCloseTo(evZielone, 6);
    expect(evKolor).toBeCloseTo(0.9333, 3); // marża 6,7% — jak w oryginale
  });

  it("Wheel: wszystkie cztery zakłady mają tę samą wartość oczekiwaną", () => {
    const ev = WHEEL_SEGMENTS.map((s) => (s.weight / WHEEL_TOTAL_WEIGHT) * s.multiplier);
    for (const e of ev) expect(e).toBeCloseTo(ev[0], 3);
    expect(ev[0]).toBeCloseTo(0.899, 3); // marża 10,1%
  });

  it("Wheel: rozkład zgadza się z panelem „ostatnie 100 rund” z oryginału (45/30/23/2)", () => {
    const proc = WHEEL_SEGMENTS.map((s) => Math.round((s.weight / WHEEL_TOTAL_WEIGHT) * 100));
    expect(proc).toEqual([45, 30, 22, 3]); // zaokrąglenia; oryginał podaje 45/30/23/2
  });

  it("Sloty: trójka, para i nic", () => {
    expect(slotPayout(["star", "star", "star"])).toBe(10);
    expect(slotPayout(["star", "star", "gem"])).toBe(1.5);
    expect(slotPayout(["star", "gem", "bell"])).toBe(0);
  });

  it("Sloty: wartość oczekiwana ~0,90 przy sześciu symbolach", () => {
    let suma = 0;
    for (const a of SLOT_SYMBOLS) for (const b of SLOT_SYMBOLS) for (const c of SLOT_SYMBOLS) suma += slotPayout([a, b, c]);
    const ev = suma / (SLOT_SYMBOLS.length ** 3);
    expect(ev).toBeCloseTo(0.903, 2);
  });

  it("wpisowe rośnie co 5 rund", () => {
    expect(anteFor(10, 1)).toBe(10);
    expect(anteFor(10, 5)).toBe(10);
    expect(anteFor(10, 6)).toBe(20);
    expect(anteFor(10, 11)).toBe(30);
    expect(anteFor(0, 99)).toBe(0); // wyłączone
  });
});

describe("kasyno — zakłady", () => {
  it("stawka schodzi z salda od razu", () => {
    let s = game({ startChips: 1000 });
    s = kasynoEngine.reduce(s, { type: "BET", amount: 200 }, ctx("a"));
    expect(s.chips.a).toBe(800);
    expect(s.bets.a.amount).toBe(200);
  });

  it("cofnięcie zakładu zwraca żetony", () => {
    let s = game({ startChips: 1000 });
    s = kasynoEngine.reduce(s, { type: "BET", amount: 200 }, ctx("a"));
    s = kasynoEngine.reduce(s, { type: "CLEAR_BET" }, ctx("a"));
    expect(s.chips.a).toBe(1000);
    expect(s.bets.a).toBeUndefined();
  });

  it("nie da się postawić więcej, niż się ma", () => {
    const s = game({ startChips: 500 });
    expect(() => kasynoEngine.reduce(s, { type: "BET", amount: 501 }, ctx("a"))).toThrow();
  });

  it("poniżej minimum wolno tylko va banque", () => {
    let s = game({ startChips: 1000, minBet: 25 });
    expect(() => kasynoEngine.reduce(s, { type: "BET", amount: 10 }, ctx("a"))).toThrow();
    // ale z resztówką mniejszą niż minimum można wejść za wszystko
    s = { ...s, chips: { ...s.chips, a: 7 } };
    s = kasynoEngine.reduce(s, { type: "BET", amount: 7 }, ctx("a"));
    expect(s.chips.a).toBe(0);
  });

  it("Double wymaga koloru, Wheel mnożnika", () => {
    const d = game({ mode: "double" });
    expect(() => kasynoEngine.reduce(d, { type: "BET", amount: 50 }, ctx("a"))).toThrow();
    expect(() => kasynoEngine.reduce(d, { type: "BET", amount: 50, pick: "fiolet" }, ctx("a"))).toThrow();
    const w = game({ mode: "wheel" });
    expect(() => kasynoEngine.reduce(w, { type: "BET", amount: 50, pick: "7" }, ctx("a"))).toThrow();
    expect(kasynoEngine.reduce(w, { type: "BET", amount: 50, pick: "35" }, ctx("a")).bets.a.pick).toBe("35");
  });
});

describe("kasyno — jackpot", () => {
  it("szansa jest proporcjonalna do wkładu", () => {
    // a wrzuca 40, b wrzuca 60 → losowanie ważone 40:60
    const wejscie = (rng: () => number) => {
      let s = game({ mode: "jackpot", ante: 0 });
      s = kasynoEngine.reduce(s, { type: "BET", amount: 40 }, ctx("a"));
      s = kasynoEngine.reduce(s, { type: "BET", amount: 60 }, ctx("b"));
      return kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 5000, rng));
    };
    // rng < 0,4 → trafia w pierwszego (a), powyżej → w drugiego (b)
    expect(wejscie(() => 0.2).outcome?.winnerUid).toBe("a");
    expect(wejscie(() => 0.8).outcome?.winnerUid).toBe("b");
  });

  it("zwycięzca bierze całą pulę", () => {
    let s = game({ mode: "jackpot", startChips: 1000, ante: 0 });
    s = kasynoEngine.reduce(s, { type: "BET", amount: 40 }, ctx("a"));
    s = kasynoEngine.reduce(s, { type: "BET", amount: 60 }, ctx("b"));
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 5000, () => 0.2));
    expect(s.outcome?.winnerUid).toBe("a");
    expect(s.chips.a).toBe(1000 - 40 + 100); // stawka wróciła w puli
    expect(s.chips.b).toBe(1000 - 60);
  });
});

describe("kasyno — eliminacja i koniec", () => {
  it("kto zejdzie do zera, odpada", () => {
    let s = game({ mode: "double", ante: 0, minBet: 5 });
    s = { ...s, chips: { ...s.chips, a: 100 } }; // resztówka przed ostatnim zakładem
    s = kasynoEngine.reduce(s, { type: "BET", amount: 100, pick: "red" }, ctx("a"));
    // rng 0,9 → pole 13 → czarne, więc a przegrywa wszystko
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 5000, () => 0.9));
    expect(s.chips.a).toBe(0);
    expect(s.out).toContain("a");
  });

  it("partia kończy się, gdy zostaje jeden", () => {
    let s = game({ mode: "double", ante: 0 });
    s = { ...s, out: ["a", "b"] }; // host sam na placu boju
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 5000)); // zaklady -> losowanie
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 9000)); // losowanie -> koniec
    expect(kasynoEngine.isFinished(s)).toBe(true);
    expect(s.winnerUid).toBe("host");
  });

  it("gdy wszyscy padną w tej samej rundzie, nikt nie jest eliminowany", () => {
    let s = game({ mode: "double", ante: 0 });
    s = { ...s, chips: Object.fromEntries(uids.map((u) => [u, 50])) };
    for (const u of uids) s = kasynoEngine.reduce(s, { type: "BET", amount: 50, pick: "red" }, ctx(u));
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 5000, () => 0.9)); // czarne
    expect(s.out).toEqual([]); // inaczej partia skończyłaby się bez zwycięzcy
  });

  it("odpadnięty nie może obstawiać", () => {
    let s = game();
    s = { ...s, out: ["a"] };
    expect(() => kasynoEngine.reduce(s, { type: "BET", amount: 50 }, ctx("a"))).toThrow();
  });

  it("tylko host zamyka rundę i kończy grę", () => {
    const s = game();
    expect(() => kasynoEngine.reduce(s, { type: "NEXT" }, ctx("a"))).toThrow();
    expect(() => kasynoEngine.reduce(s, { type: "FINISH" }, ctx("a"))).toThrow();
  });
});

describe("kasyno — bilans rundy", () => {
  it("bilans obejmuje stawkę, nie tylko wpisowe", () => {
    let s = game({ mode: "double", startChips: 1000, ante: 10 });
    s = kasynoEngine.reduce(s, { type: "BET", amount: 100, pick: "red" }, ctx("a"));
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 9000, () => 0.9)); // czarne — a przegrywa
    // realna zmiana salda: 1000 -> 890, więc bilans musi pokazać -110, nie -10
    expect(s.chips.a).toBe(890);
    expect(s.delta.a).toBe(-110);
  });

  it("bilans nie jest ujawniany w trakcie animacji", () => {
    let s = game({ mode: "jackpot", ante: 0 });
    s = kasynoEngine.reduce(s, { type: "BET", amount: 100 }, ctx("a"));
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 9000));
    expect(s.phase).toBe("losowanie");
    const wTrakcie = kasynoEngine.publicView(s, players) as { delta: Record<string, number> };
    expect(Object.keys(wTrakcie.delta)).toHaveLength(0); // inaczej wynik widać przed końcem paska
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 20000));
    const poWszystkim = kasynoEngine.publicView(s, players) as { delta: Record<string, number> };
    expect(Object.keys(poWszystkim.delta).length).toBeGreaterThan(0);
  });
});

describe("kasyno — zgodność z Firestore", () => {
  it("stan po zakładzie NIE zawiera undefined", () => {
    // Firestore odrzuca dokumenty z undefined. W Jackpocie nie ma `pick`, więc
    // { amount, pick: undefined } wywalało zapis i każdy zakład kończył się błędem 500.
    // Testy jednostkowe tego nie łapały, bo nie serializują do bazy.
    const maUndefined = (v: unknown): boolean => {
      if (v === undefined) return true;
      if (v === null || typeof v !== "object") return false;
      return Object.values(v as Record<string, unknown>).some(maUndefined);
    };
    for (const mode of ["jackpot", "sloty"] as const) {
      let s = game({ mode, ante: 0 });
      s = kasynoEngine.reduce(s, { type: "BET", amount: 50 }, ctx("a"));
      expect(maUndefined(s.bets)).toBe(false);
      expect("pick" in s.bets.a).toBe(false);
    }
    // a tam, gdzie pick jest wymagany, ma się zapisać
    let d = game({ mode: "double", ante: 0 });
    d = kasynoEngine.reduce(d, { type: "BET", amount: 50, pick: "red" }, ctx("a"));
    expect(d.bets.a.pick).toBe("red");
  });
});

describe("kasyno — widok publiczny", () => {
  it("zakłady są jawne od razu, wynik dopiero po zamknięciu", () => {
    let s = game({ mode: "double" });
    s = kasynoEngine.reduce(s, { type: "BET", amount: 50, pick: "red" }, ctx("a"));
    const wZakladach = kasynoEngine.publicView(s, players) as { bets: unknown[]; outcome: unknown };
    expect(wZakladach.bets).toHaveLength(1); // widać, kto ile na co postawił
    expect(wZakladach.outcome).toBeNull();   // ale wyniku jeszcze nie ma

    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 5000));
    const poLosowaniu = kasynoEngine.publicView(s, players) as { outcome: { colour?: string } | null };
    expect(poLosowaniu.outcome).not.toBeNull();
  });

  it("canFinish jest booleanem w każdej fazie", () => {
    let s: KasynoState = game({ mode: "double", ante: 0 });
    s = kasynoEngine.reduce(s, { type: "BET", amount: 50, pick: "red" }, ctx("a"));
    const fazy: string[] = [];
    for (let i = 0; i < 4; i++) {
      const v = kasynoEngine.publicView(s, players) as { phase: string; canFinish?: boolean };
      fazy.push(v.phase);
      expect(typeof v.canFinish).toBe("boolean");
      s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 12000 * (i + 1)));
    }
    expect(fazy).toEqual(["zaklady", "losowanie", "wynik", "zaklady"]);
  });

  it("bez zakładów NIE ma fazy losowania — pasek nie ma czego pokazać", () => {
    let s: KasynoState = game({ mode: "jackpot", ante: 0 });
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 12000)); // okno minęło, nikt nie obstawił
    expect(s.phase).toBe("wynik");
    expect(kasynoEngine.publicView(s, players)).toMatchObject({ pot: 0 });
  });

  it("wpisowe schodzi nawet w rundzie, w której nikt nie obstawił", () => {
    let s = game({ mode: "jackpot", startChips: 500, ante: 10 });
    s = kasynoEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host", 12000));
    for (const u of uids) expect(s.chips[u]).toBe(490);
  });

  it("gdy wszyscy obstawią, runda zamyka się OD RAZU", () => {
    let s = game({ mode: "jackpot", ante: 0 });
    s = kasynoEngine.reduce(s, { type: "BET", amount: 50 }, ctx("host"));
    s = kasynoEngine.reduce(s, { type: "BET", amount: 50 }, ctx("a"));
    expect(s.phase).toBe("zaklady"); // jeszcze czekamy na trzeciego
    s = kasynoEngine.reduce(s, { type: "BET", amount: 50 }, ctx("b"));
    expect(s.phase).toBe("losowanie"); // bez czekania na koniec okna
  });

  it("odpadnięci nie blokują zamknięcia rundy", () => {
    let s = game({ mode: "jackpot", ante: 0 });
    s = { ...s, out: ["b"] };
    s = kasynoEngine.reduce(s, { type: "BET", amount: 50 }, ctx("host"));
    s = kasynoEngine.reduce(s, { type: "BET", amount: 50 }, ctx("a"));
    expect(s.phase).toBe("losowanie"); // b odpadł, więc nie czekamy na niego
  });
});
