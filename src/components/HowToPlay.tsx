"use client";
import { useT } from "@/lib/i18n/provider";
import { Illustration, type IllustrationId } from "@/components/Illustration";
import type { Key } from "@/lib/i18n/dict";
// Sekcja „JAK GRAĆ" na landingu (mockup): trzy kroki z numerem w kółku.
// Zamiast ikon z biblioteki idą tu scenki z pakietu „Ekipa" — to jedyne miejsce
// na landingu, które ma wytłumaczyć produkt komuś, kto widzi go pierwszy raz.
const STEPS: { art: IllustrationId; key: Key }[] = [
  { art: "sceny/howto-pokoj", key: "landing.step1" },
  { art: "sceny/howto-kod", key: "landing.step2" },
  { art: "sceny/howto-gra", key: "landing.step3" },
];

export function HowToPlay() {
  const t = useT();
  return (
    <section className="relative flex w-full max-w-4xl flex-col gap-4">
      <h2 className="font-display text-center text-2xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_3px_0_rgb(0_0_0/0.35)]">
        {t("landing.howTo")}
      </h2>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className="flex flex-col items-center gap-2 rounded-[20px] border-[3px] border-stroke bg-panel px-4 py-5 text-center shadow-[0_4px_0_rgb(0_0_0/0.35)]"
          >
            <span className="font-display flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-sm font-bold text-white">
              {i + 1}
            </span>
            {/* Stała wysokość kadru: scenki mają różne proporcje (jedna pionowa,
                dwie poziome), więc bez tego numerki i podpisy nie stanęłyby w rzędzie. */}
            <span className="flex h-28 items-end justify-center sm:h-32">
              <Illustration id={s.art} className="max-h-full w-auto" />
            </span>
            <span className="text-base font-bold leading-snug text-ink">{t(s.key)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
