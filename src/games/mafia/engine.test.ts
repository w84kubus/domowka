import { describe, expect, it } from "vitest";
import { mafiaEngine, resolveNight, type MafiaState, type Role } from "./engine";
import { mafiaSettingsSchema, type MafiaSettings } from "./manifest";
import { mulberry32 } from "@/games/rng";
import type { Player, PlayerMap } from "@/lib/types/room";

const uids = ["host", "a", "b", "c", "d"];
const players: PlayerMap = Object.fromEntries(
  uids.map((u) => [u, { uid: u, nick: u, avatar: "🦊", joinedAt: 0, isHost: u === "host", connected: true, lastSeenAt: 0, totalScore: 0 } as Player]),
);
// stałe role do testów: host=mafia, a=detektyw, b=lekarz, c,d=mieszkańcy
const ROLES: Record<string, Role> = { host: "mafia", a: "detektyw", b: "lekarz", c: "mieszkaniec", d: "mieszkaniec" };

function game(over: Partial<MafiaSettings> = {}): MafiaState {
  const settings = { ...mafiaSettingsSchema.parse({}), ...over } as MafiaSettings;
  const s = mafiaEngine.init({ players, seatOrder: uids, settings, now: 1000, rng: mulberry32(1), seed: 1 });
  return { ...s, roles: ROLES };
}
const ctx = (uid: string, now = 2000) => ({ uid, now, rng: mulberry32(now) });
const confirmAll = (s: MafiaState) => uids.reduce((st, u) => mafiaEngine.reduce(st, { type: "CONFIRM" }, ctx(u)), s);
function noc(votes: Record<string, string>, extra: Partial<MafiaState> = {}): MafiaState {
  const s = confirmAll(game());
  return { ...s, mafiaVotes: votes, ...extra };
}

describe("mafia — rozliczenie nocy (resolveNight)", () => {
  it("mafia zabija cel", () => {
    expect(resolveNight(noc({ host: "c" })).deaths).toEqual(["c"]);
  });
  it("LEKARZ RATUJE: obrona celu anuluje zabójstwo", () => {
    expect(resolveNight(noc({ host: "c" }, { doctorSave: "c" })).deaths).toEqual([]);
  });
  it("lekarz chroni kogoś innego → cel i tak ginie", () => {
    expect(resolveNight(noc({ host: "c" }, { doctorSave: "d" })).deaths).toEqual(["c"]);
  });
  it("brak głosu mafii → nikt nie ginie", () => {
    expect(resolveNight(noc({})).deaths).toEqual([]);
  });
  it("detektyw poznaje frakcję celu", () => {
    expect(resolveNight(noc({ host: "c" }, { detectiveCheck: "host" })).detective).toEqual({ target: "host", isMafia: true });
    expect(resolveNight(noc({ host: "c" }, { detectiveCheck: "c" })).detective).toEqual({ target: "c", isMafia: false });
  });
});

describe("mafia — bezpieczeństwo", () => {
  it("publicView NIE ujawnia ról żywych graczy w trakcie gry", () => {
    const s = confirmAll(game()); // noc
    const v = mafiaEngine.publicView(s, players) as { players: { uid: string; role: string | null }[] };
    for (const p of v.players) expect(p.role).toBeNull();
    expect(JSON.stringify(v)).not.toContain("mafia");
    // detektyw widzi swoją rolę tylko w private
    expect((mafiaEngine.privateView(s, "host") as { role: string }).role).toBe("mafia");
    expect((mafiaEngine.privateView(s, "host") as { mafia: string[] }).mafia).toContain("host");
  });
});

describe("mafia — akcje i przebieg", () => {
  it("rozdanie → wszyscy CONFIRM → noc 1", () => {
    const s = confirmAll(game());
    expect(s.phase).toBe("noc");
    expect(s.night).toBe(1);
  });

  it("noc kończy się gdy wszyscy aktywni zadziałali", () => {
    let s = confirmAll(game());
    s = mafiaEngine.reduce(s, { type: "MAFIA_KILL", target: "c" }, ctx("host"));
    s = mafiaEngine.reduce(s, { type: "INVESTIGATE", target: "host" }, ctx("a"));
    expect(s.phase).toBe("noc");
    s = mafiaEngine.reduce(s, { type: "PROTECT", target: "d" }, ctx("b")); // wszyscy zadziałali
    expect(s.phase).toBe("switt");
    expect(s.deaths).toEqual(["c"]);
    expect(s.alive.c).toBe(false);
  });

  it("lekarz nie może ratować dwa razy z rzędu tej samej osoby", () => {
    let s = confirmAll(game({ doctorNoRepeat: true }));
    s = { ...s, lastDoctorSave: "d" };
    expect(() => mafiaEngine.reduce(s, { type: "PROTECT", target: "d" }, ctx("b"))).toThrow();
  });

  it("MIASTO wygrywa po wygłosowaniu jedynego mafiozy", () => {
    let s = confirmAll(game({ discussionMs: 0 }));
    // przejdź noc (mafia pudłuje — chroniony), dzień, głosowanie
    s = mafiaEngine.reduce(s, { type: "MAFIA_KILL", target: "d" }, ctx("host"));
    s = mafiaEngine.reduce(s, { type: "INVESTIGATE", target: "host" }, ctx("a"));
    s = mafiaEngine.reduce(s, { type: "PROTECT", target: "d" }, ctx("b")); // ratuje d
    expect(s.phase).toBe("switt");
    s = mafiaEngine.reduce(s, { type: "NEXT" }, ctx("host")); // → dzień
    s = mafiaEngine.reduce(s, { type: "NEXT" }, ctx("host")); // → głosowanie
    for (const u of ["a", "b", "c", "d"]) s = mafiaEngine.reduce(s, { type: "VOTE", target: "host" }, ctx(u));
    s = mafiaEngine.reduce(s, { type: "VOTE", target: "nikt" }, ctx("host"));
    expect(s.phase).toBe("koniec");
    expect(s.winner).toBe("miasto");
    expect(mafiaEngine.scores(s).a).toBe(1); // mieszkańcy wygrali
    expect(mafiaEngine.scores(s).host ?? 0).toBe(0);
  });

  it("MAFIA wygrywa, gdy liczba mafiozów ≥ pozostali żywi", () => {
    // 4 graczy: 1 mafia. Po śmierci 2 mieszkańców zostają mafia + 1 → mafia ≥ inni.
    const roles4: Record<string, Role> = { host: "mafia", a: "mieszkaniec", b: "mieszkaniec", c: "detektyw" };
    const p4: PlayerMap = Object.fromEntries(["host", "a", "b", "c"].map((u) => [u, players[u]]));
    let s = mafiaEngine.init({ players: p4, seatOrder: ["host", "a", "b", "c"], settings: mafiaSettingsSchema.parse({ mafiaCount: 1 }), now: 1, rng: mulberry32(2), seed: 2 });
    s = { ...s, roles: roles4 };
    s = ["host", "a", "b", "c"].reduce((st, u) => mafiaEngine.reduce(st, { type: "CONFIRM" }, ctx(u)), s);
    // noc 1: zabij a (lekarza brak → ginie)
    s = mafiaEngine.reduce(s, { type: "MAFIA_KILL", target: "a" }, ctx("host"));
    s = mafiaEngine.reduce(s, { type: "INVESTIGATE", target: "b" }, ctx("c"));
    expect(s.phase).toBe("switt"); // a nie żyje; żywi: host,b,c (mafia 1 vs inni 2)
    expect(s.winner).toBeNull();
    s = mafiaEngine.reduce(s, { type: "NEXT" }, ctx("host")); // dzień
    s = mafiaEngine.reduce(s, { type: "NEXT" }, ctx("host")); // głosowanie
    // remis/nikt → nikt nie ginie → wraca noc
    for (const u of ["host", "b", "c"]) s = mafiaEngine.reduce(s, { type: "VOTE", target: "nikt" }, ctx(u));
    expect(s.phase).toBe("noc");
    // noc 2: zabij b → żywi host,c (mafia 1 = inni 1) → mafia wygrywa
    s = mafiaEngine.reduce(s, { type: "MAFIA_KILL", target: "b" }, ctx("host"));
    s = mafiaEngine.reduce(s, { type: "INVESTIGATE", target: "host" }, ctx("c"));
    expect(s.phase).toBe("koniec");
    expect(s.winner).toBe("mafia");
  });
});
