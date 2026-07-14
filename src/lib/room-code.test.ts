import { describe, expect, it } from "vitest";
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "./room-code";

describe("room-code", () => {
  it("alfabet nie zawiera mylących znaków I, O, 0, 1", () => {
    for (const ch of ["I", "O", "0", "1"]) {
      expect(ROOM_CODE_ALPHABET).not.toContain(ch);
    }
  });

  it("generuje kod o właściwej długości z alfabetu", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
      expect(isValidRoomCode(code)).toBe(true);
    }
  });

  it("generateRoomCode jest deterministyczne przy tym samym rng", () => {
    const mkRng = () => {
      const seq = [0, 0.5, 0.99, 0.25];
      let i = 0;
      return () => seq[i++ % seq.length];
    };
    expect(generateRoomCode(mkRng())).toBe(generateRoomCode(mkRng()));
    // pierwszy znak: floor(0 * 32) = 0 → 'A'
    expect(generateRoomCode(mkRng())[0]).toBe("A");
  });

  it("normalizuje input: wielkie litery, odrzuca niedozwolone, obcina do 4", () => {
    expect(normalizeRoomCode("k7qm")).toBe("K7QM");
    expect(normalizeRoomCode("k7-q m9x")).toBe("K7QM"); // spacje/myślniki out, obcięte do 4
    expect(normalizeRoomCode("io01ab")).toBe("AB"); // I,O,0,1 odfiltrowane
  });

  it("isValidRoomCode odrzuca zły format", () => {
    expect(isValidRoomCode("ABC")).toBe(false);
    expect(isValidRoomCode("ABCDE")).toBe(false);
    expect(isValidRoomCode("ABO1")).toBe(false);
  });
});
