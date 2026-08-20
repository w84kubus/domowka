"use client";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALES, type Locale } from "@/lib/i18n/types";

const LABEL: Record<Locale, string> = { pl: "PL", en: "EN" };

// Przełącznik języka. Świadomie NIE używa flag: flaga to kraj, nie język —
// angielskim mówi się w kilkudziesięciu krajach, a i tak nie każdy rozpozna właściwą.
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div
      className={`inline-flex overflow-hidden rounded-[12px] border-2 border-stroke bg-panel ${className}`}
      role="group"
      aria-label="Language / Język"
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            className={`font-display px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint ${
              active ? "bg-mint text-sheet-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}
