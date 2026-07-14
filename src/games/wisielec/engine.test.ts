import { describe, expect, it } from "vitest";
import { wisielecEngine, type WisielecState } from "./engine";
import { wisielecSettingsSchema, type WisielecSettings } from "./manifest";
import { mulberry32 } from "@/games/rng";
import type { Player, PlayerMap } from "@/lib/types/room";

function player(uid: string, isHost = false): Player {
  return { uid, nick: uid, avatar: "🦊", joinedAt: 0, isHost, connected: true, lastSeenAt: 0, totalScore: 0 };
}
const players: PlayerMap = { host: player("host", true), a: player("a"), b: player("b") };

function mk(mode: WisielecSettings["mode"], overrides: Partial<WisielecSettings> = {}, password = "KOT"): WisielecState {
  const settings = { ...wisielecSettingsSchema.parse({}), mode, lives: 8, rounds: 1, ...overrides } as WisielecSettings;
  const s = wisielecEngine.init({ players, seatOrder: ["host", "a", "b"], settings, now: 1000, rng: mulberry32(1), seed: 1 });
  // dla trybów ze wspólnym/wylosowanym hasłem nadpisujemy hasło dla determinizmu testu
  if (mode !== "zadajacy") return { ...s, password, category: "Zwierzę" };
  return s;
}
const ctx = (uid: string, now = 2000) => ({ uid, now, rng: mulberry32(now) });
const guess = (s: WisielecState, uid: string, letter: string) => wisielecEngine.reduce(s, { type: "GUESS", letter }, ctx(uid));

describe("wisielec — tryb KOOPERACJA", () => {
  it("trafienia odsłaniają, wygrana gdy hasło pełne; punkt +3 dla wszystkich", () => {
    let s = mk("kooperacja"); // guessers [host,a,b], tura host
    s = guess(s, "host", "K");
    s = guess(s, "a", "O");
    expect(s.phase).toBe("zgadywanie");
    s = guess(s, "b", "T"); // KOT pełne
    expect(s.phase).toBe("wynik");
    expect(s.result).toBe("wygrana");
    expect(s.scores.host).toBe(3);
    expect(s.scores.b).toBe(3);
  });

  it("pudła zapełniają szubienicę; przegrana przy maxWrong", () => {
    let s = mk("kooperacja", { lives: 2 });
    s = guess(s, "host", "Z"); // pudło 1 → tura a
    s = guess(s, "a", "X"); // pudło 2 → przegrana
    expect(s.phase).toBe("wynik");
    expect(s.result).toBe("przegrana");
  });

  it("nie można zgadywać poza swoją turą", () => {
    const s = mk("kooperacja");
    expect(() => guess(s, "a", "K")).toThrow(); // tura hosta
  });

  it("tajność: publicView nie ujawnia nieodgadniętych liter", () => {
    let s = mk("kooperacja");
    s = guess(s, "host", "K");
    const view = wisielecEngine.publicView(s, players) as { mask: { ch: string | null }[] };
    expect(view.mask.map((m) => m.ch).join("|")).toBe("K|null|null".replace(/null/g, "")); // O,T ukryte
  });
});

describe("wisielec — tryb WYŚCIG", () => {
  it("pierwszy, kto odgadnie, wygrywa i dostaje +5", () => {
    let s = mk("wyscig");
    s = guess(s, "a", "K");
    s = guess(s, "a", "O");
    s = guess(s, "a", "T"); // a kończy pierwszy
    expect(s.phase).toBe("wynik");
    expect(s.result).toBe("wygrana");
    expect(s.winners).toEqual(["a"]);
    expect(s.scores.a).toBe(5);
  });

  it("gdy wszystkim skończą się życia → przegrana", () => {
    let s = mk("wyscig", { lives: 1 });
    s = guess(s, "host", "Z"); // pudło → host out
    s = guess(s, "a", "Z");
    s = guess(s, "b", "Z");
    expect(s.phase).toBe("wynik");
    expect(s.result).toBe("przegrana");
  });

  it("każdy gra równolegle, może zgadywać niezależnie", () => {
    let s = mk("wyscig");
    s = guess(s, "host", "K");
    s = guess(s, "b", "O");
    // niezależne stany
    const privH = wisielecEngine.privateView(s, "host") as { hits: string[] };
    const privB = wisielecEngine.privateView(s, "b") as { hits: string[] };
    expect(privH.hits).toEqual(["K"]);
    expect(privB.hits).toEqual(["O"]);
  });
});

describe("wisielec — tryb ZADAJĄCY", () => {
  it("układający ustawia hasło, potem zgadują pozostali; trafienie = kolejna tura", () => {
    let s = mk("zadajacy");
    expect(s.phase).toBe("ustawianie");
    expect(s.setterUid).toBe("host");
    s = wisielecEngine.reduce(s, { type: "SET_PASSWORD", password: "KOT", category: "Zwierzę" }, ctx("host"));
    expect(s.phase).toBe("zgadywanie");
    expect(s.guessers).toEqual(["a", "b"]);
    // tura a (pierwszy guesser); trafienia trzymają turę (hitContinues domyślnie true)
    s = guess(s, "a", "K");
    s = guess(s, "a", "O");
    s = guess(s, "a", "T"); // a odgaduje całość
    expect(s.result).toBe("wygrana");
    expect(s.scores.a).toBe(3 + 5); // 3 litery po +1 i +5 za hasło
  });

  it("gdy nikt nie odgadnie (szubienica pełna), układający +3", () => {
    let s = mk("zadajacy", { lives: 2 });
    s = wisielecEngine.reduce(s, { type: "SET_PASSWORD", password: "KOT", category: "X" }, ctx("host"));
    s = guess(s, "a", "Z"); // pudło 1 → tura b
    s = guess(s, "b", "X"); // pudło 2 → przegrana
    expect(s.result).toBe("przegrana");
    expect(s.scores.host).toBe(3);
  });

  it("SOLVE całego hasła: trafione = wygrana, pudło = +2 do szubienicy", () => {
    let s = mk("zadajacy");
    s = wisielecEngine.reduce(s, { type: "SET_PASSWORD", password: "KOT", category: "X" }, ctx("host"));
    s = wisielecEngine.reduce(s, { type: "SOLVE", word: "kot" }, ctx("a")); // ignoruje wielkość liter
    expect(s.result).toBe("wygrana");
    expect(s.scores.a).toBe(5);
  });
});

describe("wisielec — ogonki", () => {
  it("domyślnie 'a' NIE trafia w 'ą'", () => {
    let s = mk("kooperacja", {}, "KĄT");
    s = guess(s, "host", "A"); // pudło, bo Ą != A
    expect(s.wrong).toBe(1);
  });
  it("z ignoreOgonki 'a' trafia w 'ą'", () => {
    let s = mk("kooperacja", { ignoreOgonki: true }, "KĄT");
    s = guess(s, "host", "A"); // trafienie
    expect(s.wrong).toBe(0);
  });
});
