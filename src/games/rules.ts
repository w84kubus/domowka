// G3 (UPGRADE.md §G): zasady gier — jedna karta, bez ściany tekstu.
// Oddzielone od manifestów, żeby nie puchnął registry.

export interface GameRules {
  howTo: string; // 2-3 zdania "jak grać"
  steps: string[]; // zwięzłe kroki rozgrywki
  tip?: string; // opcjonalna ciekawostka/wskazówka
}

export const GAME_RULES: Record<string, GameRules> = {
  odcien: {
    howTo: "Kolor błyska na kilka sekund i znika. Odtwarzasz go z pamięci trzema suwakami — im bliżej, tym więcej punktów.",
    steps: [
      "Kolor wyświetla się przez kilka sekund",
      "Znika — nikt go już nie widzi",
      "Ustawiasz suwaki tak, żeby trafić w zapamiętany odcień",
      "Odsłonięcie: oryginał obok wszystkich prób, ranking wg celności",
    ],
    tip: "Zapamiętuj słowami („ciepły róż, dość ciemny”), nie samym obrazem — pamięć na nazwy jest trwalsza.",
  },
  stoper: {
    howTo: "Odmierzaj czas w głowie — zatrzymaj stoper jak najbliżej celu. Nie patrzysz na cyfry!",
    steps: [
      "Stoper rusza, cel pojawia się na ekranie",
      "Liczysz w głowie sekundy",
      "Klikasz STOP, gdy myślisz, że czas minął",
      "Im mniejszy błąd, tym więcej punktów",
    ],
    tip: "Oddychaj miarowo — to naturalny metronom.",
  },
  "panstwa-miasta": {
    howTo: "Klasyka z zeszytów szkolnych — wymyśl słowa na wylosowaną literę w 6 kategoriach.",
    steps: [
      "Losowana jest litera",
      "Wpisz słowa w każdej kategorii (na tę literę!)",
      "Kto pierwszy wypełni wszystko — może kliknąć STOP",
      "Wspólna weryfikacja: można kwestionować odpowiedzi",
      "Unikalne odpowiedzi = 10 pkt, powtórki = 5 pkt, jedyny = 15 pkt",
    ],
  },
  wisielec: {
    howTo: "Zgaduj hasło litera po literze — każdy błąd dodaje element szubienicy.",
    steps: [
      "Hasło jest ukryte za kreskami",
      "Po kolei zgadujecie litery",
      "Trafiona litera się odsłania",
      "Pudło = kawałek szubienicy",
      "Odgadnijcie hasło, zanim ludzik zawiśnie!",
    ],
    tip: "Zacznij od samogłosek: A, E, I, O.",
  },
  impostor: {
    howTo: "Wszyscy dostają to samo hasło — oprócz impostora. Zadawajcie sobie pytania i znajdźcie intruza!",
    steps: [
      "Każdy dostaje hasło (impostor nie lub inne)",
      "Po kolei dajesz jednowyrazową podpowiedź",
      "Dyskusja: kto zachowywał się podejrzanie?",
      "Głosowanie: wytypuj impostora",
      "Złapany impostor może jeszcze zgadnąć hasło!",
    ],
    tip: "Nie dawaj zbyt oczywistych podpowiedzi — impostor je wykorzysta.",
  },
  mafia: {
    howTo: "Gra psychologiczna — miasto kontra mafia. W nocy mafia zabija, w dzień wszyscy głosują.",
    steps: [
      "Role rozdane w tajemnicy: mafia, detektyw, lekarz, mieszkańcy",
      "Noc: mafia wybiera ofiarę, lekarz chroni, detektyw sprawdza",
      "Świt: narrator ogłasza, kto nie przeżył",
      "Dzień: dyskusja i głosowanie — kogo linczujemy?",
      "Gra do zwycięstwa miasta lub mafii",
    ],
    tip: "Mafia wygrywa, gdy jest ich tyle samo co reszty.",
  },
};
