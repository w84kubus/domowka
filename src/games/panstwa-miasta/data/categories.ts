// Zestawy kategorii (SPEC §5.3). To tylko NAZWY kategorii — odpowiedzi wpisują gracze,
// więc żadnych list słów tu nie trzeba.
export const CATEGORY_SETS: Record<string, { name: string; categories: string[] }> = {
  klasyk: {
    name: "Klasyk",
    categories: ["Państwo", "Miasto", "Imię", "Zwierzę", "Roślina", "Rzecz"],
  },
  rozszerzony: {
    name: "Rozszerzony",
    categories: ["Państwo", "Miasto", "Imię", "Zwierzę", "Roślina", "Rzecz", "Zawód", "Marka", "Potrawa", "Film lub serial"],
  },
  popkultura: {
    name: "Popkultura",
    categories: ["Film", "Serial", "Zespół muzyczny", "Postać z gry", "Youtuber/streamer", "Piosenka"],
  },
  wiedza: {
    name: "Wiedza",
    categories: ["Rzeka", "Góra lub pasmo", "Stolica", "Pierwiastek", "Postać historyczna", "Wynalazek"],
  },
  motoryzacja: {
    name: "Motoryzacja",
    categories: ["Marka auta", "Model auta", "Część samochodowa", "Kierowca", "Tor wyścigowy"],
  },
  impreza: {
    name: "Impreza",
    categories: ["Alkohol", "Przekąska", "Powiedzonko", "Coś w tym pokoju", "Kiepska wymówka", "Rzecz, której się wstydzisz"],
  },
};

export type CategorySetId = keyof typeof CATEGORY_SETS;

// Pula liter (SPEC §5.3): domyślnie polski alfabet bez Q V X Y i bez ogonków.
export const BASE_LETTERS = "ABCDEFGHIJKLMNOPRSTUWZ".split("");
// Hardcore dokłada ogonki.
export const HARDCORE_LETTERS = "ĄĆĘŁŃÓŚŹŻ".split("");
