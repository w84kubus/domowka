import type { GameEvent } from "@/games/types";
import { MAX_HIGHLIGHTS, type RoomHighlight } from "@/lib/types/room";

// Bez "server-only": to czyste funkcje na zwykłych danych, bez sekretów ani admin SDK,
// dzięki czemu dają się testować w vitest.
// Czysta logika „Rekordów pokoju" (UPGRADE.md §8) — wydzielona z runnera, żeby dała się
// testować bez Firestore. Rdzeń nie zna konkretnych gier: wygrane liczy z wyników silnika,
// a wyróżnienia bierze z tych zdarzeń, które silnik SAM oznaczył jako meta.rekord === true.

/** Kto wygrał grę. Remis daje wygraną każdemu z najlepszym wynikiem — to gra imprezowa. */
export function winnersOf(scores: Record<string, number>): string[] {
  const values = Object.values(scores);
  if (!values.length) return [];
  const best = Math.max(...values);
  return Object.entries(scores)
    .filter(([, s]) => s === best)
    .map(([uid]) => uid);
}

/** Wyróżnienia z bieżącej partii zdarzeń, dopisane na początek listy i przycięte. */
export function buildHighlights(
  events: GameEvent[],
  gameId: string,
  now: number,
  existing: RoomHighlight[] = [],
): RoomHighlight[] | null {
  const fresh: RoomHighlight[] = events
    .filter((ev) => ev.meta?.rekord === true && typeof ev.meta?.uid === "string")
    .map((ev) => ({
      gameId,
      uid: ev.meta!.uid as string,
      text: ev.text,
      ...(ev.key ? { key: ev.key, params: ev.params } : {}),
      at: now,
    }));
  if (!fresh.length) return null; // nic nowego — nie ruszamy pola w Firestore
  return [...fresh, ...existing].slice(0, MAX_HIGHLIGHTS);
}
