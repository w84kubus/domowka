// Matematyka wypłat. Czyste dane i funkcje — zero losowości i czasu, żeby silnik
// pozostał deterministyczny i testowalny.
//
// Liczby odtworzone z gier referencyjnych, nie wymyślone. Sprawdzenie w testach:
// w każdym trybie WSZYSTKIE zakłady mają tę samą wartość oczekiwaną, czyli żaden
// nie jest „lepszy" — różni je tylko zmienność. Tak działają oryginały.

// ——— DOUBLE ———
// 15 pól: 0 zielone (×14), 1–7 czerwone (×2), 8–14 czarne (×2).
// EV: 7/15 × 2 = 0,933 dla koloru, 1/15 × 14 = 0,933 dla zielonego → marża 6,7%.
export const DOUBLE_SLOTS = 15;
export type DoubleColour = "red" | "black" | "green";

export function doubleColourOf(n: number): DoubleColour {
  if (n === 0) return "green";
  return n <= 7 ? "red" : "black";
}

export const DOUBLE_PAYOUT: Record<DoubleColour, number> = { red: 2, black: 2, green: 14 };

// ——— WHEEL ———
// Cztery wyniki o różnych szansach. Wagi dobrane tak, żeby każdy zakład miał
// identyczną wartość oczekiwaną 0,899 → marża 10,1%. Zgadza się z panelem
// „ostatnie 100 rund" z oryginału: 45 / 30 / 23 / 2.
export const WHEEL_SEGMENTS: { multiplier: number; weight: number }[] = [
  { multiplier: 2, weight: 4497 },
  { multiplier: 3, weight: 2998 },
  { multiplier: 4, weight: 2248 },
  { multiplier: 35, weight: 257 },
];
export const WHEEL_TOTAL_WEIGHT = WHEEL_SEGMENTS.reduce((a, s) => a + s.weight, 0);

// ——— SLOTY ———
// Trzy bębny, sześć symboli o równych szansach.
// P(trójka) = 6/216 = 2,78%, P(dokładnie para) = 90/216 = 41,7%.
// EV = 0,0278 × 10 + 0,4167 × 1,5 = 0,903 → marża 9,7%, spójnie z Wheel.
export const SLOT_SYMBOLS = ["cherry", "lemon", "bell", "star", "gem", "seven"] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];
export const SLOT_TRIPLE = 10;
export const SLOT_PAIR = 1.5;

/** Wypłata ze slotów jako mnożnik stawki (0 = przepadło). */
export function slotPayout(reels: readonly string[]): number {
  const [a, b, c] = reels;
  if (a === b && b === c) return SLOT_TRIPLE;
  if (a === b || b === c || a === c) return SLOT_PAIR;
  return 0;
}

/** Losowanie ważone. Zwraca indeks. rng musi pochodzić z ctx (SPEC §3.4). */
export function weightedPick(weights: number[], rng: () => number): number {
  const total = weights.reduce((a, w) => a + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/**
 * Ile trwa animacja losowania. Jackpot dostaje najwięcej, bo to jego moment —
 * pasek z awatarami musi zdążyć zbudować napięcie, zanim wyhamuje.
 * Sloty nie używają paska, więc wystarczy im krótki obrót bębnów.
 */
export const SPIN_MS: Record<string, number> = {
  jackpot: 9000,
  double: 7000,
  wheel: 7000,
  sloty: 2500,
};

/** Wpisowe rośnie co 5 rund, żeby partia „do ostatniego stojącego" miała koniec. */
export function anteFor(base: number, round: number): number {
  if (base === 0) return 0;
  return base * (1 + Math.floor((round - 1) / 5));
}
