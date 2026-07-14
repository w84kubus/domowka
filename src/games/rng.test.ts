import { describe, expect, it } from "vitest";
import { mulberry32, shuffle } from "./rng";

describe("mulberry32", () => {
  it("jest deterministyczny dla tego samego seeda", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("zwraca wartości w [0, 1)", () => {
    const r = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("różne seedy dają różne sekwencje", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("shuffle", () => {
  it("jest deterministyczny i zachowuje elementy", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = shuffle(input, mulberry32(7));
    const b = shuffle(input, mulberry32(7));
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // nie mutuje wejścia
  });
});
