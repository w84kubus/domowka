import { describe, expect, it } from "vitest";
import { odcienEngine, type OdcienState } from "./engine";
import { odcienSettingsSchema } from "./manifest";
import { accuracyOf, deltaE, hslToRgb, rgbToHsl } from "./color";
import type { PlayerMap } from "@/lib/types/room";

const players: PlayerMap = Object.fromEntries(
  ["host", "a", "b"].map((uid) => [
    uid,
    { uid, nick: uid, avatar: "cat", joinedAt: 0, isHost: uid === "host", connected: true, lastSeenAt: 0, totalScore: 0 },
  ]),
);

// rng deterministyczne — silnik ma być w pełni powtarzalny
const rng = () => 0.42;
const ctx = (uid: string, now = 1000) => ({ uid, now, rng });

function game(over: Partial<ReturnType<typeof odcienSettingsSchema.parse>> = {}) {
  return odcienEngine.init({
    settings: odcienSettingsSchema.parse(over),
    players,
    seatOrder: ["host", "a", "b"],
    now: 0,
    rng,
    seed: 1,
  });
}

describe("odcień — przebieg rundy", () => {
  it("zaczyna od pokazu koloru z terminem", () => {
    const s = game();
    expect(s.phase).toBe("pokaz");
    expect(s.phaseEndsAt).toBe(5000);
  });

  it("po upływie pokazu przechodzi do zgadywania", () => {
    const s = odcienEngine.reduce(game(), { type: "PHASE_TIMEOUT" }, ctx("host"));
    expect(s.phase).toBe("zgadywanie");
    expect(s.phaseEndsAt).toBeNull(); // czekamy na graczy, nie na zegar
  });

  it("odsłania dopiero, gdy wszyscy wyślą", () => {
    let s = odcienEngine.reduce(game(), { type: "PHASE_TIMEOUT" }, ctx("host"));
    s = odcienEngine.reduce(s, { type: "SUBMIT", color: { r: 1, g: 2, b: 3 } }, ctx("host"));
    expect(s.phase).toBe("zgadywanie");
    s = odcienEngine.reduce(s, { type: "SUBMIT", color: { r: 1, g: 2, b: 3 } }, ctx("a"));
    expect(s.phase).toBe("zgadywanie");
    s = odcienEngine.reduce(s, { type: "SUBMIT", color: { r: 1, g: 2, b: 3 } }, ctx("b"));
    expect(s.phase).toBe("wynik");
  });

  it("nie da się wysłać dwa razy", () => {
    let s = odcienEngine.reduce(game(), { type: "PHASE_TIMEOUT" }, ctx("host"));
    s = odcienEngine.reduce(s, { type: "SUBMIT", color: { r: 1, g: 2, b: 3 } }, ctx("host"));
    expect(() => odcienEngine.reduce(s, { type: "SUBMIT", color: { r: 9, g: 9, b: 9 } }, ctx("host"))).toThrow();
  });

  it("trafienie w punkt daje 100% celności", () => {
    let s = odcienEngine.reduce(game(), { type: "PHASE_TIMEOUT" }, ctx("host"));
    const target = s.target;
    for (const uid of ["host", "a", "b"]) {
      s = odcienEngine.reduce(s, { type: "SUBMIT", color: target }, ctx(uid));
    }
    expect(s.results.host.accuracy).toBe(100);
    expect(s.perfect).toContain("host");
  });

  it("kończy się po ostatniej rundzie", () => {
    let s = game({ rounds: 1 });
    s = odcienEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host"));
    for (const uid of ["host", "a", "b"]) s = odcienEngine.reduce(s, { type: "SUBMIT", color: s.target }, ctx(uid));
    s = odcienEngine.reduce(s, { type: "NEXT" }, ctx("host"));
    expect(odcienEngine.isFinished(s)).toBe(true);
  });

  it("tylko host może zamknąć rundę i zakończyć grę", () => {
    const s = odcienEngine.reduce(game(), { type: "PHASE_TIMEOUT" }, ctx("host"));
    expect(() => odcienEngine.reduce(s, { type: "NEXT" }, ctx("a"))).toThrow();
    expect(() => odcienEngine.reduce(s, { type: "FINISH" }, ctx("a"))).toThrow();
  });
});

describe("odcień — bezpieczeństwo", () => {
  it("KOLOR ZNIKA z publicView na czas zgadywania", () => {
    const shown = game();
    // w fazie pokazu kolor jest jawny — wszyscy mają go widzieć
    expect(JSON.stringify(odcienEngine.publicView(shown, players))).toContain("target");

    const guessing = odcienEngine.reduce(shown, { type: "PHASE_TIMEOUT" }, ctx("host"));
    const view = JSON.stringify(odcienEngine.publicView(guessing, players));
    // gdyby kolor tu został, wystarczyłby DevTools, żeby trafiać idealnie co rundę
    expect(view).not.toContain("target");
    expect(view).not.toContain(hexTarget(guessing));
  });

  it("cudze typy są tajne do odsłonięcia", () => {
    let s = odcienEngine.reduce(game(), { type: "PHASE_TIMEOUT" }, ctx("host"));
    s = odcienEngine.reduce(s, { type: "SUBMIT", color: { r: 17, g: 34, b: 51 } }, ctx("a"));
    const view = JSON.stringify(odcienEngine.publicView(s, players));
    expect(view).toContain("a"); // wiadomo, ŻE wysłał
    expect(view).not.toContain("112233"); // ale nie CO wysłał
    // sam zainteresowany widzi swój typ
    expect((odcienEngine.privateView(s, "a") as { myGuess: string }).myGuess).toBe("#112233");
    expect((odcienEngine.privateView(s, "b") as { myGuess: string | null }).myGuess).toBeNull();
  });
});

function hexTarget(s: OdcienState): string {
  return "#" + [s.target.r, s.target.g, s.target.b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

describe("odcień — neutralne tło", () => {
  it("flaga jest w KAŻDEJ fazie, żeby tło nie migało między rundami", () => {
    let s = game();
    const fazy: string[] = [];
    const sprawdz = (st: typeof s) => {
      const v = odcienEngine.publicView(st, players) as { phase: string; neutralBg?: boolean };
      fazy.push(v.phase);
      expect(v.neutralBg).toBe(true);
    };
    sprawdz(s);                                                         // pokaz
    s = odcienEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("host"));  // zgadywanie
    sprawdz(s);
    for (const uid of ["host", "a", "b"]) s = odcienEngine.reduce(s, { type: "SUBMIT", color: s.target }, ctx(uid));
    sprawdz(s);                                                         // wynik
    s = odcienEngine.reduce(s, { type: "FINISH" }, ctx("host"));
    sprawdz(s);                                                         // koniec
    expect(fazy).toEqual(["pokaz", "zgadywanie", "wynik", "koniec"]);
  });
});

describe("odcień — matematyka koloru", () => {
  it("identyczne kolory mają zerową różnicę", () => {
    expect(deltaE({ r: 10, g: 20, b: 30 }, { r: 10, g: 20, b: 30 })).toBeCloseTo(0);
  });

  it("Delta E jest perceptualna, nie euklidesowa w RGB", () => {
    // Ta sama odległość w RGB (60 na jednym kanale), a dla oka RÓŻNA:
    // zieleń widać wyraźnie mocniej niż błękit. Naiwne RGB dałoby tu remis.
    const baza = { r: 100, g: 100, b: 100 };
    const zielen = deltaE(baza, { r: 100, g: 160, b: 100 });
    const blekit = deltaE(baza, { r: 100, g: 100, b: 160 });
    expect(zielen).toBeGreaterThan(blekit);
  });

  it("celność spada wraz z różnicą i nie schodzi poniżej zera", () => {
    expect(accuracyOf(0)).toBe(100);
    expect(accuracyOf(10)).toBe(80);
    expect(accuracyOf(999)).toBe(0);
  });

  it("HSL i RGB są wzajemnie odwracalne", () => {
    for (const [h, s, l] of [[0, 100, 50], [120, 60, 40], [240, 80, 70], [45, 55, 55]]) {
      const back = rgbToHsl(hslToRgb(h, s, l));
      expect(Math.abs(back.h - h)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.s - s)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.l - l)).toBeLessThanOrEqual(1);
    }
  });

  it("losowany kolor nie jest szary ani skrajnie ciemny/jasny", () => {
    for (let i = 0; i < 50; i++) {
      const r = Math.random();
      const c = hslToRgb(Math.floor(r * 360), 45 + Math.floor(r * 50), 35 + Math.floor(r * 35));
      const { s, l } = rgbToHsl(c);
      expect(s).toBeGreaterThanOrEqual(40);
      expect(l).toBeGreaterThanOrEqual(30);
      expect(l).toBeLessThanOrEqual(75);
    }
  });
});
