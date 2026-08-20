// Matematyka kolorów dla Odcienia. Czyste funkcje — zero losowości i czasu, żeby silnik
// pozostał deterministyczny i testowalny (SPEC §3.4).

export interface Rgb {
  r: number; // 0–255
  g: number;
  b: number;
}

export const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function hexOf({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("");
}

/** sRGB (0–255) → składowa liniowa (0–1). Odwrócenie korekcji gamma. */
function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** sRGB → CIE XYZ (biel D65). */
function toXyz({ r, g, b }: Rgb): [number, number, number] {
  const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)];
  return [
    R * 0.4124564 + G * 0.3575761 + B * 0.1804375,
    R * 0.2126729 + G * 0.7151522 + B * 0.072175,
    R * 0.0193339 + G * 0.119192 + B * 0.9503041,
  ];
}

/** CIE XYZ → Lab. Lab jest w przybliżeniu perceptualnie jednorodna — o to tu chodzi. */
function toLab(rgb: Rgb): [number, number, number] {
  const [x, y, z] = toXyz(rgb);
  // Punkt bieli D65
  const [xn, yn, zn] = [0.95047, 1.0, 1.08883];
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = [f(x / xn), f(y / yn), f(z / zn)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Delta E (CIE76) — odległość dwóch kolorów tak, jak widzi ją oko.
 *
 * Dlaczego nie zwykła odległość RGB: oko jest DUŻO czulsze na zieleń niż na błękit,
 * więc identyczny dystans w RGB potrafi wyglądać na „prawie to samo” albo „zupełnie inny
 * kolor”. Punktowanie po RGB karałoby graczy losowo. W Lab dystans odpowiada wrażeniu.
 *
 * Skala orientacyjna: <1 niewidoczne gołym okiem, 2–10 zauważalne, >25 wyraźnie inny kolor.
 */
export function deltaE(a: Rgb, b: Rgb): number {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

/** Celność 0–100 z Delta E. 0 różnicy = 100 pkt; od ok. 50 Delta E już zero. */
export function accuracyOf(dE: number): number {
  return Math.max(0, Math.round(100 - dE * 2));
}

/** HSL → RGB. h 0–360, s/l 0–100. */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const S = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = L - c / 2;
  const [r, g, b] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  return { r: clamp255((r + m) * 255), g: clamp255((g + m) * 255), b: clamp255((b + m) * 255) };
}

/** RGB → HSL, do wstępnego ustawienia suwaków w trybie HSL. */
export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100) };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === R ? 60 * (((G - B) / d) % 6) : max === G ? 60 * ((B - R) / d + 2) : 60 * ((R - G) / d + 4);
  return { h: Math.round(((h % 360) + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Losuje kolor do zgadywania. Świadomie NIE bierzemy w pełni losowego RGB: wyszłoby
 * mnóstwo szarawych, przygaszonych barw, które trudno zapamiętać i nudno odtwarzać.
 * Losujemy w HSL z sensownym nasyceniem i jasnością — kolory są wyraziste i rozróżnialne.
 */
export function randomColor(rng: () => number): Rgb {
  const h = Math.floor(rng() * 360);
  const s = 45 + Math.floor(rng() * 50); // 45–95%
  const l = 35 + Math.floor(rng() * 35); // 35–70%
  return hslToRgb(h, s, l);
}
