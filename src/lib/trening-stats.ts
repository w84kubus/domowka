// Statystyki serii treningowej Stopera.
//
// Osobny moduł, bo to jedyna część treningu, w której da się pomylić rachunki —
// i jedyna, którą da się przetestować bez przeglądarki. Sam pomiar czasu żyje
// w komponencie, bo bez `performance.now()` nie ma czego liczyć.
//
// Sedno: rozdzielamy BŁĄD ŚREDNI (jak blisko celu) od ODCHYLENIA (czy mylisz się
// zawsze w tę samą stronę) i od ROZRZUTU (czy jesteś powtarzalny). To rozróżnienie
// jest cały sens statystyk w treningu — stałe spóźnianie się o 0,3 s poprawia się
// świadomie, losowe ±0,3 s wymaga zupełnie czego innego.

/** Pojedyncza próba: błąd ze znakiem w ms. Dodatni = za późno. */
export type Proba = { bladMs: number; celMs: number };

export interface Statystyki {
  prob: number;
  /** Średni błąd BEZWZGLĘDNY — „jak blisko celu jesteś". */
  sredniBlad: number;
  /** Średni błąd ZE ZNAKIEM — dodatni znaczy „systematycznie za późno". */
  odchylenie: number;
  /** Odchylenie standardowe błędu ze znakiem — „jak bardzo skaczesz". */
  rozrzut: number;
  /** Najlepsza próba w serii (najmniejszy błąd bezwzględny). */
  najlepsza: number;
  /** Ile prób z rzędu, licząc od końca, zmieściło się w progu. */
  seria: number;
}

/**
 * Próg „dobrej" próby skaluje się z celem: trafić 10 s z dokładnością 0,2 s jest
 * trudniejsze niż 2 s z tą samą dokładnością. 3% celu, ale nie mniej niż 100 ms,
 * bo przy krótkich celach sam czas reakcji zjadałby cały budżet.
 */
export function progDobrej(celMs: number): number {
  return Math.max(100, celMs * 0.03);
}

export function policz(proby: Proba[]): Statystyki | null {
  if (proby.length === 0) return null;

  const bledy = proby.map((p) => p.bladMs);
  const bezwzgledne = bledy.map(Math.abs);
  const n = bledy.length;

  const odchylenie = bledy.reduce((a, b) => a + b, 0) / n;
  const sredniBlad = bezwzgledne.reduce((a, b) => a + b, 0) / n;

  // Rozrzut liczymy wokół WŁASNEGO odchylenia, nie wokół zera: gracz, który
  // spóźnia się równo o 0,5 s, jest bardzo powtarzalny i ma to zobaczyć.
  const wariancja = bledy.reduce((a, b) => a + (b - odchylenie) ** 2, 0) / n;

  let seria = 0;
  for (let i = proby.length - 1; i >= 0; i--) {
    if (Math.abs(proby[i].bladMs) <= progDobrej(proby[i].celMs)) seria++;
    else break;
  }

  return {
    prob: n,
    sredniBlad,
    odchylenie,
    rozrzut: Math.sqrt(wariancja),
    najlepsza: Math.min(...bezwzgledne),
    seria,
  };
}

/**
 * Jednozdaniowa diagnoza serii — to ona zamienia liczby w coś, z czym można
 * cokolwiek zrobić. Zwraca klucz tłumaczenia, nie gotowy tekst.
 */
export type Diagnoza = "zaMaloProb" | "spozniasz" | "spieszysz" | "rozrzut" | "rowno";

export function diagnoza(s: Statystyki | null): Diagnoza {
  if (!s || s.prob < 3) return "zaMaloProb";

  // Odchylenie uznajemy za istotne dopiero, gdy przewyższa rozrzut — inaczej
  // „średnio +0,2 s" przy skokach ±0,8 s brzmiałoby jak diagnoza, a jest szumem.
  const istotne = Math.abs(s.odchylenie) > Math.max(80, s.rozrzut * 0.8);
  if (istotne) return s.odchylenie > 0 ? "spozniasz" : "spieszysz";
  if (s.rozrzut > 300) return "rozrzut";
  return "rowno";
}
