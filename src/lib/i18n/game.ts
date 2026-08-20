import type { Key } from "./dict";

// Nazwy i opisy gier tłumaczymy PRZEZ KONWENCJĘ z id ("game.stoper.name"), a nie przez
// pola w manifeście: manifest to czyste dane importowane też przez serwer, więc nie ma
// tam miejsca na tłumaczenia. Brak wpisu → UI pokazuje polskie pole z manifestu.
export const gameNameKey = (id: string) => `game.${id}.name` as Key;
export const gameTaglineKey = (id: string) => `game.${id}.tagline` as Key;
