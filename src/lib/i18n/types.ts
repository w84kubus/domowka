export const LOCALES = ["pl", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pl";

/**
 * Nazwa ciasteczka z językiem.
 * MUSI żyć w module bez "use client": Next.js zamienia moduły klienckie na referencje,
 * więc stała zaimportowana z provider.tsx do layoutu serwerowego byłaby `undefined`,
 * a cookies().get(undefined) po cichu zwracałoby brak języka.
 *
 * Wartość pochodzi z czasów, gdy aplikacja nazywała się Domówka — NIE zmieniać przy
 * rebrandingu: klucz identyfikuje dane już zapisane w przeglądarkach graczy. Zmiana =
 * wracający gracz traci ustawienia i wygląda to jak wyczyszczenie danych bez powodu.
 */
export const LOCALE_COOKIE = "domowka-locale";

/** Parametry podstawiane w tłumaczeniu, np. {round} → 3. */
export type Params = Record<string, string | number>;

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}
