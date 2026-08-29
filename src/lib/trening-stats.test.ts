import { describe, expect, it } from "vitest";
import { diagnoza, policz, progDobrej, type Proba } from "./trening-stats";

const p = (bledy: number[], celMs = 10000): Proba[] => bledy.map((bladMs) => ({ bladMs, celMs }));

describe("trening — próg dobrej próby", () => {
  it("skaluje się z celem", () => {
    expect(progDobrej(10000)).toBe(300);
    expect(progDobrej(30000)).toBe(900);
  });
  it("ma podłogę 100 ms, żeby krótkie cele były wykonalne", () => {
    // 3% z 2 s to 60 ms — mniej niż czas reakcji, więc podnosimy do 100
    expect(progDobrej(2000)).toBe(100);
  });
});

describe("trening — statystyki", () => {
  it("pusta seria nie daje statystyk", () => {
    expect(policz([])).toBeNull();
  });

  it("rozróżnia błąd średni od odchylenia", () => {
    // ±400 ms na przemian: blisko celu „średnio", ale zero systematycznego błędu
    const s = policz(p([400, -400, 400, -400]))!;
    expect(s.sredniBlad).toBe(400); // bezwzględnie zawsze 400
    expect(s.odchylenie).toBe(0); // ze znakiem znosi się do zera
  });

  it("wykrywa stałe spóźnianie", () => {
    const s = policz(p([300, 320, 310, 290]))!;
    expect(s.odchylenie).toBeGreaterThan(280);
    expect(s.rozrzut).toBeLessThan(50); // bardzo powtarzalny
  });

  it("rozrzut liczy wokół własnego odchylenia, nie wokół zera", () => {
    // Gracz spóźniony ZAWSZE o 500 ms jest maksymalnie powtarzalny
    const s = policz(p([500, 500, 500]))!;
    expect(s.odchylenie).toBe(500);
    expect(s.rozrzut).toBe(0);
  });

  it("najlepsza próba to najmniejszy błąd bezwzględny", () => {
    expect(policz(p([-40, 900, 300]))!.najlepsza).toBe(40);
  });
});

describe("trening — seria trafień", () => {
  it("liczy od końca i zatrzymuje się na pudle", () => {
    // próg dla 10 s to 300 ms
    expect(policz(p([50, 900, 100, 200, 20]))!.seria).toBe(3);
  });
  it("pudło na końcu zeruje serię", () => {
    expect(policz(p([50, 50, 900]))!.seria).toBe(0);
  });
  it("respektuje próg zależny od celu", () => {
    // 250 ms mieści się w progu dla 30 s (900), ale nie dla 2 s (100)
    expect(policz([{ bladMs: 250, celMs: 30000 }])!.seria).toBe(1);
    expect(policz([{ bladMs: 250, celMs: 2000 }])!.seria).toBe(0);
  });
});

describe("trening — diagnoza", () => {
  it("milczy przy zbyt małej liczbie prób", () => {
    expect(diagnoza(policz(p([500, 500])))).toBe("zaMaloProb");
  });

  it("stałe spóźnianie", () => {
    expect(diagnoza(policz(p([400, 380, 420, 390])))).toBe("spozniasz");
  });

  it("stałe śpieszenie się", () => {
    expect(diagnoza(policz(p([-400, -380, -420, -390])))).toBe("spieszysz");
  });

  it("NIE nazywa odchyleniem czegoś, co ginie w rozrzucie", () => {
    // średnia +150 ms, ale skoki ±800 — to szum, nie nawyk
    expect(diagnoza(policz(p([950, -700, 800, -650])))).toBe("rozrzut");
  });

  it("równa i celna seria", () => {
    expect(diagnoza(policz(p([60, -50, 40, -30])))).toBe("rowno");
  });
});
