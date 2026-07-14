import { describe, expect, it } from "vitest";
import { newPlayer, pickNewHost } from "./rooms";
import { DISCONNECT_AFTER_MS, type PlayerMap } from "@/lib/types/room";

function mkPlayers(now: number): PlayerMap {
  return {
    a: { ...newPlayer("a", "Ala", "🦊", now - 3000, true), lastSeenAt: now },
    b: { ...newPlayer("b", "Bob", "🐼", now - 2000, false), lastSeenAt: now },
    c: { ...newPlayer("c", "Cez", "🐧", now - 1000, false), lastSeenAt: now },
  };
}

describe("pickNewHost", () => {
  const now = 1_000_000;

  it("null gdy pokój pusty po wyjściu", () => {
    const players = { a: newPlayer("a", "Ala", "🦊", now, true) };
    expect(pickNewHost(players, [], "a", now)).toBeNull();
  });

  it("respektuje seatOrder", () => {
    const players = mkPlayers(now);
    expect(pickNewHost(players, ["c", "b", "a"], "a", now)).toBe("c");
  });

  it("bez seatOrder: najwcześniej dołączony połączony gracz", () => {
    const players = mkPlayers(now);
    // host a wychodzi; b dołączył przed c → b
    expect(pickNewHost(players, [], "a", now)).toBe("b");
  });

  it("pomija rozłączonych, jeśli jest ktoś połączony", () => {
    const players = mkPlayers(now);
    players.b.lastSeenAt = now - DISCONNECT_AFTER_MS - 1; // b rozłączony
    expect(pickNewHost(players, [], "a", now)).toBe("c");
  });
});
