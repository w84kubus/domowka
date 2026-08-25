"use client";
import { useT } from "@/lib/i18n/provider";
import { Illustration } from "@/components/Illustration";

// Kafelek „wkrótce" na końcu sekcji gier.
//
// Świadomie NIE wygląda jak karta gry: przerywana ramka i półprzezroczyste tło,
// czyli ten sam język co puste sloty graczy w lobby. Karta gry to wizytówka czegoś,
// w co można zagrać teraz — ten kafelek jest obietnicą i nie powinien udawać oferty.
//
// Ikona jest w stylu pakietu IKON GIER (bąbelkowy 3D, gruby ciemny kontur), a nie
// płaskich postaci z „Ekipy": kafelek stoi w siatce obok kart gier i to z nimi ma się
// zgadzać. Prompt, którym powstała: design/PROMPT-IKONY-GEMINI.md, ETAP 9.
export function ComingSoonCard() {
  const t = useT();
  return (
    <li className="flex flex-col gap-2 rounded-[20px] border-[3px] border-dashed border-white/25 bg-panel p-5 text-ink-muted">
      {/* Kwadratowe pole 44 px jak ikony gier obok, z `object-contain`. Samo `w-auto`
          nie wystarcza: dopóki obrazek się nie wczyta, przeglądarka nie zna proporcji
          i wylicza szerokość z sufitu — zmierzone 140 px zamiast 46. */}
      <Illustration id="ikony/wkrotce" priority className="size-11 object-contain" />
      <h3 className="font-display break-words text-base font-bold uppercase leading-tight tracking-[0.04em] text-ink sm:text-lg">
        {t("landing.moreSoon")}
      </h3>
      <p className="text-sm font-semibold leading-snug">{t("landing.moreSoonBody")}</p>
    </li>
  );
}
