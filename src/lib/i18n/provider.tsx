"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { translate, type Key } from "./dict";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, type Params } from "./types";

// Źródłem prawdy jest CIASTECZKO, nie localStorage. Serwer je czyta w layoucie i podaje
// tu jako `initial`, więc pierwszy render na serwerze i pierwszy na kliencie są zgodne —
// zero niezgodności hydratacji i zero mignięcia polskim u anglojęzycznego gracza.
const Ctx = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: Key, params?: Params) => string;
} | null>(null);

export function I18nProvider({ initial, children }: { initial: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    // rok, żeby wybór przetrwał; SameSite=Lax wystarcza — to zwykła preferencja UI
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = l;
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: (key: Key, params?: Params) => translate(locale, key, params) }),
    [locale, setLocale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  // Poza providerem (np. w testach) działa po polsku zamiast wybuchać.
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: Key, params?: Params) => translate(DEFAULT_LOCALE, key, params),
    };
  }
  return ctx;
}

/** Skrót — w komponentach zwykle potrzeba samego `t`. */
export function useT() {
  return useI18n().t;
}
