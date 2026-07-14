// Hasła do Impostora (SPEC §5.5). Pisane ręcznie: `powiazane` to bliskie, ale MYLĄCE słowa
// z tej samej kategorii (do trybu SŁOWO POWIĄZANE). Jakość haseł to połowa jakości gry.
export interface WordEntry {
  slowo: string;
  kategoria: string;
  podpowiedz: string; // krótka wskazówka opisowa
  powiazane: string[]; // bliskie słowa, którymi impostor może dostać zamiennik
}

export const WORDS: WordEntry[] = [
  // — Miejsca —
  { slowo: "Plaża", kategoria: "Miejsce", podpowiedz: "Latem tłoczno, zimą pusto", powiazane: ["Basen", "Jezioro", "Molo", "Sauna"] },
  { slowo: "Biblioteka", kategoria: "Miejsce", podpowiedz: "Prosisz o ciszę", powiazane: ["Księgarnia", "Czytelnia", "Muzeum", "Archiwum"] },
  { slowo: "Lotnisko", kategoria: "Miejsce", podpowiedz: "Czekasz z walizką", powiazane: ["Dworzec", "Port", "Terminal", "Przystanek"] },
  { slowo: "Kościół", kategoria: "Miejsce", podpowiedz: "Bije tam dzwon", powiazane: ["Katedra", "Kaplica", "Klasztor", "Cmentarz"] },
  { slowo: "Siłownia", kategoria: "Miejsce", podpowiedz: "Pachnie potem i determinacją", powiazane: ["Basen", "Boisko", "Kort", "Studio"] },
  { slowo: "Szpital", kategoria: "Miejsce", podpowiedz: "Białe fartuchy", powiazane: ["Przychodnia", "Apteka", "Sanatorium", "Klinika"] },
  // — Jedzenie —
  { slowo: "Pizza", kategoria: "Jedzenie", podpowiedz: "Dzielisz na kawałki", powiazane: ["Zapiekanka", "Focaccia", "Tarta", "Placek"] },
  { slowo: "Lody", kategoria: "Jedzenie", podpowiedz: "Topią się w upale", powiazane: ["Sorbet", "Gofr", "Deser", "Shake"] },
  { slowo: "Pierogi", kategoria: "Jedzenie", podpowiedz: "Z różnym farszem", powiazane: ["Uszka", "Kołduny", "Ravioli", "Knedle"] },
  { slowo: "Kawa", kategoria: "Jedzenie", podpowiedz: "Poranny zastrzyk", powiazane: ["Herbata", "Espresso", "Kakao", "Latte"] },
  { slowo: "Rosół", kategoria: "Jedzenie", podpowiedz: "Niedzielny obiad", powiazane: ["Barszcz", "Żurek", "Bulion", "Krupnik"] },
  { slowo: "Sushi", kategoria: "Jedzenie", podpowiedz: "Jesz pałeczkami", powiazane: ["Ramen", "Tempura", "Poke", "Maki"] },
  // — Zwierzęta —
  { slowo: "Pingwin", kategoria: "Zwierzę", podpowiedz: "Elegant, który nie lata", powiazane: ["Mewa", "Foka", "Kaczka", "Kormoran"] },
  { slowo: "Słoń", kategoria: "Zwierzę", podpowiedz: "Nie zapomina", powiazane: ["Nosorożec", "Hipopotam", "Mamut", "Żyrafa"] },
  { slowo: "Wilk", kategoria: "Zwierzę", podpowiedz: "Wyje do księżyca", powiazane: ["Pies", "Lis", "Kojot", "Ryś"] },
  { slowo: "Rekin", kategoria: "Zwierzę", podpowiedz: "Płetwa nad wodą", powiazane: ["Delfin", "Orka", "Barrakuda", "Wieloryb"] },
  { slowo: "Sowa", kategoria: "Zwierzę", podpowiedz: "Mądra i nocna", powiazane: ["Orzeł", "Jastrząb", "Nietoperz", "Kruk"] },
  // — Zawody —
  { slowo: "Strażak", kategoria: "Zawód", podpowiedz: "Zjeżdża po rurze", powiazane: ["Policjant", "Ratownik", "Żołnierz", "Kominiarz"] },
  { slowo: "Nauczyciel", kategoria: "Zawód", podpowiedz: "Stawia oceny", powiazane: ["Wykładowca", "Korepetytor", "Trener", "Wychowawca"] },
  { slowo: "Kucharz", kategoria: "Zawód", podpowiedz: "Rządzi w kuchni", powiazane: ["Piekarz", "Cukiernik", "Kelner", "Barman"] },
  { slowo: "Pilot", kategoria: "Zawód", podpowiedz: "Głowa w chmurach", powiazane: ["Stewardesa", "Kapitan", "Kierowca", "Maszynista"] },
  { slowo: "Fryzjer", kategoria: "Zawód", podpowiedz: "Pracuje nożyczkami", powiazane: ["Barber", "Kosmetyczka", "Stylista", "Wizażysta"] },
  // — Sport —
  { slowo: "Siatkówka", kategoria: "Sport", podpowiedz: "Przez wysoką siatkę", powiazane: ["Koszykówka", "Tenis", "Badminton", "Piłka ręczna"] },
  { slowo: "Boks", kategoria: "Sport", podpowiedz: "Rękawice i ring", powiazane: ["Zapasy", "Judo", "Karate", "MMA"] },
  { slowo: "Narty", kategoria: "Sport", podpowiedz: "Zjazd po śniegu", powiazane: ["Snowboard", "Łyżwy", "Sanki", "Biathlon"] },
  { slowo: "Piłka nożna", kategoria: "Sport", podpowiedz: "Gra się nogami", powiazane: ["Futsal", "Rugby", "Piłka ręczna", "Hokej"] },
  // — Przedmioty —
  { slowo: "Parasol", kategoria: "Przedmiot", podpowiedz: "Ratunek w deszczu", powiazane: ["Płaszcz", "Kalosze", "Namiot", "Markiza"] },
  { slowo: "Zegarek", kategoria: "Przedmiot", podpowiedz: "Nosisz na nadgarstku", powiazane: ["Bransoletka", "Budzik", "Stoper", "Opaska"] },
  { slowo: "Okulary", kategoria: "Przedmiot", podpowiedz: "Ostrzej widać", powiazane: ["Soczewki", "Lornetka", "Lupa", "Gogle"] },
  { slowo: "Klucze", kategoria: "Przedmiot", podpowiedz: "Bez nich nie wejdziesz", powiazane: ["Kłódka", "Zamek", "Karta", "Breloczek"] },
  // — Impreza —
  { slowo: "Karaoke", kategoria: "Impreza", podpowiedz: "Śpiewasz mimo braku talentu", powiazane: ["Koncert", "Dyskoteka", "Chór", "Playback"] },
  { slowo: "Grill", kategoria: "Impreza", podpowiedz: "Dym i kiełbaski", powiazane: ["Ognisko", "Piknik", "Barbecue", "Majówka"] },
  { slowo: "Wódka", kategoria: "Impreza", podpowiedz: "Setka na odwagę", powiazane: ["Piwo", "Wino", "Nalewka", "Whisky"] },
  { slowo: "Prezent", kategoria: "Impreza", podpowiedz: "Zawinięty w papier", powiazane: ["Niespodzianka", "Kartka", "Bukiet", "Bon"] },
];
