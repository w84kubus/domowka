// Deterministyczny PRNG (SPEC §3.4): silniki gier używają go zamiast Math.random,
// dzięki czemu partię da się odtworzyć z seeda, a testy są powtarzalne.
// mulberry32 — szybki, dobry rozkład, seed 32-bit.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Losowe ziarno do zapisania w secret/state przy starcie gry. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** Tasowanie Fishera-Yatesa z podanym rng (deterministyczne). Nie mutuje wejścia. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
