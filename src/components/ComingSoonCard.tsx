"use client";
import { PackageOpen } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

// Kafelek „wkrótce" na końcu sekcji gier.
//
// Świadomie NIE wygląda jak karta gry: przerywana ramka i półprzezroczyste tło,
// czyli ten sam język co puste sloty graczy w lobby. Karta gry to wizytówka czegoś,
// w co można zagrać teraz — ten kafelek jest obietnicą i nie powinien udawać oferty.
//
// Ikona jest TYMCZASOWA (Lucide). Docelowo wchodzi tu ilustracja z pakietu, w tym
// samym stylu co ikony gier obok — prompt w design/PROMPT-IKONY-GEMINI.md, ETAP 9.
export function ComingSoonCard() {
  const t = useT();
  return (
    <li className="flex flex-col gap-2 rounded-[20px] border-[3px] border-dashed border-white/25 bg-panel p-5 text-ink-muted">
      <PackageOpen size={44} strokeWidth={2} className="text-mint opacity-70" aria-hidden />
      <h3 className="font-display break-words text-base font-bold uppercase leading-tight tracking-[0.04em] text-ink sm:text-lg">
        {t("landing.moreSoon")}
      </h3>
      <p className="text-sm font-semibold leading-snug">{t("landing.moreSoonBody")}</p>
    </li>
  );
}
