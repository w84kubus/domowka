import { describe, expect, it } from "vitest";
import { dedupeAvatar, dedupeNick, sanitizeNick } from "./room";

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

describe("dedupeAvatar", () => {
  it("zwraca wybór gracza, gdy nikt go nie ma", () => {
    expect(dedupeAvatar("cat", ["dog", "bird"])).toBe("cat");
  });

  it("przy kolizji daje pierwszy wolny z listy", () => {
    expect(dedupeAvatar("cat", ["cat"])).toBe("dog");
  });

  it("przeskakuje kilka zajętych z rzędu", () => {
    expect(dedupeAvatar("cat", ["cat", "dog", "bird"])).toBe("rabbit");
  });

  it("pełen pokój: 16 graczy dostaje 16 różnych awatarów", () => {
    const wydane: string[] = [];
    for (let i = 0; i < 16; i++) wydane.push(dedupeAvatar("cat", wydane));
    expect(new Set(wydane).size).toBe(16);
  });

  it("awatary spoza listy (stare emoji) też blokują", () => {
    // Gracz z czasów emoji siedzi w pokoju — jego ikona jest zajęta, choć nie da
    // się jej wybrać na nowo.
    expect(dedupeAvatar("cat", ["🦊", "cat"])).toBe("dog");
  });
});
