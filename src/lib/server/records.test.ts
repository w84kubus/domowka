import { describe, expect, it } from "vitest";
import { buildHighlights, winnersOf } from "./records";
import type { GameEvent } from "@/games/types";
import type { RoomHighlight } from "@/lib/types/room";

describe("rekordy pokoju — wygrane", () => {
  it("wygrywa najwyższy wynik", () => {
    expect(winnersOf({ a: 10, b: 7, c: 3 })).toEqual(["a"]);
  });

  it("remis daje wygraną każdemu z najlepszym wynikiem", () => {
    expect(winnersOf({ a: 10, b: 10, c: 3 }).sort()).toEqual(["a", "b"]);
  });

  it("brak wyników = brak zwycięzców", () => {
    expect(winnersOf({})).toEqual([]);
  });

  it("radzi sobie z wynikami ujemnymi i zerami", () => {
    expect(winnersOf({ a: -5, b: -1, c: -9 })).toEqual(["b"]);
    expect(winnersOf({ a: 0, b: 0 }).sort()).toEqual(["a", "b"]);
  });
});

describe("rekordy pokoju — wyróżnienia", () => {
  const ev = (meta?: Record<string, unknown>): GameEvent => ({ type: "idealnie", text: "Idealne trafienie", meta });

  it("bierze tylko zdarzenia oznaczone przez silnik jako rekord", () => {
    const out = buildHighlights([ev({ uid: "a", rekord: true }), ev({ uid: "b" }), ev()], "stoper", 100);
    expect(out).toHaveLength(1);
    expect(out![0]).toMatchObject({ uid: "a", gameId: "stoper", at: 100 });
  });

  it("brak rekordów zwraca null, żeby nie ruszać pola w Firestore", () => {
    expect(buildHighlights([ev({ uid: "a" })], "stoper", 100)).toBeNull();
    expect(buildHighlights([], "stoper", 100)).toBeNull();
  });

  it("nowe trafiają na początek, przed dotychczasowe", () => {
    const stare: RoomHighlight[] = [{ gameId: "stoper", uid: "z", text: "stare", at: 1 }];
    const out = buildHighlights([ev({ uid: "a", rekord: true })], "stoper", 100, stare)!;
    expect(out.map((h) => h.uid)).toEqual(["a", "z"]);
  });

  it("lista nie rośnie w nieskończoność", () => {
    const stare: RoomHighlight[] = Array.from({ length: 20 }, (_, i) => ({
      gameId: "stoper", uid: `u${i}`, text: "x", at: i,
    }));
    const out = buildHighlights([ev({ uid: "nowy", rekord: true })], "stoper", 100, stare)!;
    expect(out).toHaveLength(20);
    expect(out[0].uid).toBe("nowy");
    expect(out.at(-1)!.uid).toBe("u18"); // najstarszy wypadł
  });

  it("ignoruje rekord bez poprawnego uid", () => {
    expect(buildHighlights([ev({ rekord: true }), ev({ uid: 42, rekord: true })], "stoper", 100)).toBeNull();
  });
});
