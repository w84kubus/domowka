import { describe, expect, it } from "vitest";
import { dedupeNick, sanitizeNick } from "./room";

describe("sanitizeNick", () => {
  it("przycina, zbija białe znaki, usuwa nowe linie", () => {
    expect(sanitizeNick("  Damian  ")).toBe("Damian");
    expect(sanitizeNick("Ala\nma\tkota")).toBe("Ala ma kota");
  });

  it("obcina do 16 znaków", () => {
    expect(sanitizeNick("a".repeat(20))).toHaveLength(16);
  });

  it("zachowuje polskie znaki i emoji", () => {
    expect(sanitizeNick("Żółć 🦊")).toBe("Żółć 🦊");
  });
});

describe("dedupeNick", () => {
  it("zwraca oryginał gdy brak kolizji", () => {
    expect(dedupeNick("Kuba", ["Ala", "Ola"])).toBe("Kuba");
  });

  it("dopisuje (2) przy duplikacie i idzie dalej", () => {
    expect(dedupeNick("Kuba", ["Kuba"])).toBe("Kuba (2)");
    expect(dedupeNick("Kuba", ["Kuba", "Kuba (2)"])).toBe("Kuba (3)");
  });
});
