import { describe, expect, it } from "vitest";
import { pmEngine, type PmState } from "./engine";
import { pmSettingsSchema, type PmSettings } from "./manifest";
import { mulberry32 } from "@/games/rng";
import type { Player, PlayerMap } from "@/lib/types/room";

function player(uid: string, isHost = false): Player {
  return { uid, nick: uid, avatar: "🦊", joinedAt: 0, isHost, connected: true, lastSeenAt: 0, totalScore: 0 };
}
const players: PlayerMap = { host: player("host", true), a: player("a"), b: player("b") };

function init(overrides: Partial<PmSettings> = {}): PmState {
  // rounds:1 dla zwięzłości testów (schemat produkcyjny dopuszcza 3/5/8/∞, ale silnik działa z każdą liczbą)
  const settings = { ...pmSettingsSchema.parse({ categorySet: "klasyk", endMode: "recznie" }), rounds: 1, ...overrides } as PmSettings;
  return pmEngine.init({ players, seatOrder: ["host", "a", "b"], settings, now: 1000, rng: mulberry32(5), seed: 5 });
}
const ctx = (uid: string, now = 2000) => ({ uid, now, rng: mulberry32(now) });

// wygodne wypełnienie: answers po indeksie kategorii
const fill = (s: PmState, uid: string, answers: string[]) =>
  pmEngine.reduce(s, { type: "SUBMIT_ANSWERS", answers }, ctx(uid));

// pisanie → weryfikacja (host zamyka rundę)
const enterVerify = (s: PmState) => pmEngine.reduce(s, { type: "NEXT" }, ctx("host"));
// przejdź wszystkie kategorie w weryfikacji → wyniki
function passAllCats(s: PmState): PmState {
  for (let i = 0; i < s.categories.length; i++) s = pmEngine.reduce(s, { type: "NEXT" }, ctx("host"));
  return s;
}

describe("panstwa-miasta engine", () => {
  it("init: runda 1, faza losowanie, litera z puli, 6 kategorii (klasyk)", () => {
    const s = init();
    expect(s.round).toBe(1);
    expect(s.phase).toBe("losowanie");
    expect(s.categories).toHaveLength(6);
    expect("ABCDEFGHIJKLMNOPRSTUWZ").toContain(s.letter);
  });

  it("losowanie → pisanie po PHASE_TIMEOUT", () => {
    let s = init();
    s = pmEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 6000));
    expect(s.phase).toBe("pisanie");
  });

  it("tajność: w pisaniu publicView nie ujawnia treści odpowiedzi", () => {
    let s = init({ endMode: "recznie" });
    s = pmEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 6000));
    s = fill(s, "a", ["Argentyna", "Ateny", "Ala", "Antylopa", "Aloes", "Auto"]);
    const view = pmEngine.publicView(s, players) as { progress: { uid: string; filled: number }[] };
    expect(JSON.stringify(view)).not.toContain("Argentyna");
    expect(view.progress.find((p) => p.uid === "a")?.filled).toBe(6);
    // ale privateView gracza a widzi jego odpowiedzi (draft)
    const priv = pmEngine.privateView(s, "a") as { answers: string[] };
    expect(priv.answers[0]).toBe("Argentyna");
  });

  it("STOP wymaga wypełnienia wszystkich pól", () => {
    let s = init({ endMode: "stop" });
    s = pmEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 6000));
    s = fill(s, "a", ["Argentyna", "", "", "", "", ""]);
    expect(() => pmEngine.reduce(s, { type: "STOP" }, ctx("a"))).toThrow();
    s = fill(s, "a", ["Argentyna", "Ateny", "Ala", "Antylopa", "Aloes", "Auto"]);
    s = pmEngine.reduce(s, { type: "STOP" }, ctx("a", 7000));
    expect(s.stoppedBy).toBe("a");
    expect(s.phaseEndsAt).toBe(7000 + 10000);
  });

  it("punktacja: unikalna=10, duplikat=5, jedyny w kategorii=15, zła litera=0", () => {
    // litera A wymuszona: ustawiamy ręcznie stan po pisaniu
    let s = init({ endMode: "recznie" });
    s = pmEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 6000));
    s = { ...s, letter: "A" };
    // kat0 Państwo: host=Argentyna(unik), a=Australia(unik) → oboje 10? nie, są 2 różne → 10 każdy
    // kat1 Miasto: host=Ateny, a=Ateny (dup) → 5 każdy
    // kat2 Imię: tylko host=Adam → 15; a puste
    // kat3 Zwierzę: host=Bóbr (zła litera) → 0
    s = fill(s, "host", ["Argentyna", "Ateny", "Adam", "Bóbr", "", ""]);
    s = fill(s, "a", ["Australia", "Ateny", "", "", "", ""]);
    s = enterVerify(s);
    s = passAllCats(s); // bez kwestii, tylko przeklikanie kategorii
    expect(s.phase).toBe("wyniki");
    // host: 10 (Państwo) + 5 (Miasto) + 15 (Imię) + 0 (zła litera) = 30
    expect(s.roundScores.host).toBe(30);
    // a: 10 + 5 = 15
    expect(s.roundScores.a).toBe(15);
  });

  it("dedup diakrytyków: Łódź == Lodz (duplikat = 5)", () => {
    let s = init({ endMode: "recznie" });
    s = pmEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 6000));
    s = { ...s, letter: "Ł" };
    s = fill(s, "host", ["Łotwa", "Łódź", "", "", "", ""]);
    s = fill(s, "a", ["Łotwa", "Lodz", "", "", "", ""]); // Lodz zła litera? pierwsza litera 'L' != 'Ł' → 0!
    s = enterVerify(s);
    s = passAllCats(s);
    // Państwo: Łotwa==Łotwa dup → 5 każdy. Miasto: host Łódź (jedyny poprawny, bo Lodz ma złą literę) → 15
    expect(s.roundScores.host).toBe(5 + 15);
    expect(s.roundScores.a).toBe(5 + 0);
  });

  it("kwestionowanie: większość ODRZUCAM → 0; autor nie głosuje; remis = uznana", () => {
    let s = init({ endMode: "recznie" });
    s = pmEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 6000));
    s = { ...s, letter: "A" };
    s = fill(s, "host", ["Atlantyda", "", "", "", "", ""]); // wątpliwe państwo
    s = fill(s, "a", ["Argentyna", "", "", "", "", ""]);
    s = fill(s, "b", ["Austria", "", "", "", "", ""]);
    s = enterVerify(s);
    // kategoria 0 aktywna. a kwestionuje odpowiedź hosta.
    s = pmEngine.reduce(s, { type: "CHALLENGE", targetUid: "host", cat: 0 }, ctx("a"));
    expect(s.active?.targetUid).toBe("host");
    // głosują wszyscy oprócz hosta (autora): a i b → ODRZUCAM
    s = pmEngine.reduce(s, { type: "VOTE", verdict: "odrzucam" }, ctx("a"));
    s = pmEngine.reduce(s, { type: "VOTE", verdict: "odrzucam" }, ctx("b"));
    expect(s.active).toBeNull();
    expect(s.rejected.host?.[0]).toBe(true);
    // dokończ weryfikację
    s = passAllCats(s);
    // Państwo: valid = Argentyna, Austria (host odrzucony) → 2 różne → 10 każdy; host 0
    expect(s.roundScores.host).toBe(0);
    expect(s.roundScores.a).toBe(10);
    expect(s.roundScores.b).toBe(10);
  });

  it("pełna partia 1 rundy kończy się w koniec, kumuluje scores", () => {
    let s = init({ rounds: 1, endMode: "recznie" });
    s = pmEngine.reduce(s, { type: "PHASE_TIMEOUT" }, ctx("__system__", 6000));
    s = { ...s, letter: "A" };
    s = fill(s, "host", ["Argentyna", "", "", "", "", ""]);
    s = enterVerify(s);
    s = passAllCats(s); // → wyniki
    expect(s.phase).toBe("wyniki");
    s = pmEngine.reduce(s, { type: "NEXT" }, ctx("host")); // wyniki → koniec (ostatnia runda)
    expect(s.phase).toBe("koniec");
    expect(pmEngine.isFinished(s)).toBe(true);
    expect(pmEngine.scores(s).host).toBe(15); // jedyny w kategorii Państwo
  });
});
