// Zbiory haseł do Wisielca (SPEC §5.4). Hasła używane w trybach WYŚCIG i KOOPERACJA
// (w trybie ZADAJĄCY hasło wpisuje gracz). Pisane ręcznie, po polsku.
export const WORD_SETS: Record<string, { name: string; words: string[] }> = {
  zwierzeta: {
    name: "Zwierzęta",
    words: [
      "Żyrafa", "Jeż", "Wiewiórka", "Niedźwiedź", "Sowa", "Łoś", "Bocian", "Ślimak",
      "Wilk", "Zając", "Chomik", "Delfin", "Rekin", "Motyl", "Pszczoła", "Żółw",
      "Kangur", "Pingwin", "Nietoperz", "Jaszczurka", "Wąż", "Sarna", "Borsuk", "Ropucha",
    ],
  },
  jedzenie: {
    name: "Jedzenie",
    words: [
      "Pierogi", "Żurek", "Bigos", "Placki ziemniaczane", "Gołąbki", "Rosół", "Schabowy", "Naleśniki",
      "Sernik", "Pączek", "Kotlet", "Kapusta", "Ogórki kiszone", "Barszcz", "Kluski śląskie", "Pizza",
      "Kebab", "Sushi", "Makaron", "Frytki", "Lody", "Kanapka", "Zupa pomidorowa", "Racuchy",
    ],
  },
  filmy: {
    name: "Filmy i seriale",
    words: [
      "Wiedźmin", "Kler", "Chłopi", "Miś", "Kingsajz", "Seksmisja", "Vabank", "Psy",
      "Boże Ciało", "Zimna wojna", "Dzień świra", "Kevin sam w domu", "Shrek", "Titanic", "Matrix", "Gladiator",
      "Incepcja", "Joker", "Avatar", "Nietykalni", "Rodzinka", "Ranczo", "Klan", "Świat według Kiepskich",
    ],
  },
  miasta: {
    name: "Polskie miasta",
    words: [
      "Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź", "Szczecin", "Lublin",
      "Białystok", "Katowice", "Rzeszów", "Toruń", "Częstochowa", "Zakopane", "Sopot", "Gdynia",
      "Olsztyn", "Kielce", "Opole", "Gorzów", "Zamość", "Malbork", "Wieliczka", "Świnoujście",
    ],
  },
  marki: {
    name: "Marki",
    words: [
      "Ikea", "Żabka", "Biedronka", "Orlen", "Allegro", "Nike", "Adidas", "Apple",
      "Samsung", "Netflix", "Lidl", "Rossmann", "Coca-Cola", "Pepsi", "Nintendo", "Sony",
      "Google", "Amazon", "Wedel", "Tymbark", "Prince Polo", "Ptasie mleczko", "Delma", "Lays",
    ],
  },
  sport: {
    name: "Sport",
    words: [
      "Siatkówka", "Koszykówka", "Piłka nożna", "Skoki narciarskie", "Żużel", "Tenis", "Boks", "Pływanie",
      "Kolarstwo", "Lekkoatletyka", "Hokej", "Curling", "Wioślarstwo", "Judo", "Szermierka", "Golf",
      "Snowboard", "Wspinaczka", "Biathlon", "Rugby", "Badminton", "Szachy", "Piłka ręczna", "Łyżwiarstwo",
    ],
  },
  zawody: {
    name: "Zawody",
    words: [
      "Nauczyciel", "Lekarz", "Strażak", "Policjant", "Kucharz", "Fryzjer", "Mechanik", "Elektryk",
      "Programista", "Pielęgniarka", "Kierowca", "Ogrodnik", "Architekt", "Dziennikarz", "Weterynarz", "Piekarz",
      "Ślusarz", "Stolarz", "Górnik", "Rolnik", "Aktor", "Muzyk", "Adwokat", "Księgowy",
    ],
  },
  dom: {
    name: "Rzeczy w domu",
    words: [
      "Lodówka", "Odkurzacz", "Czajnik", "Pralka", "Kanapa", "Żyrandol", "Poduszka", "Firanka",
      "Telewizor", "Mikrofalówka", "Suszarka", "Parapet", "Wieszak", "Dywan", "Roleta", "Kaloryfer",
      "Ekspres", "Toster", "Blender", "Deska", "Szafa", "Komoda", "Lustro", "Zasłona",
    ],
  },
  trudne: {
    name: "Trudne",
    words: [
      "Chrząszcz", "Źdźbło", "Bezwzględny", "Wszczęcie", "Pchła", "Zmarszczka", "Przestępca",
      "Wewnątrzszkolny", "Następstwo", "Źrebię", "Zażółć", "Gżegżółka", "Szczypce", "Wciąż", "Płaszcz",
      "Rozczochrany", "Bezwstydny", "Ćwierćnuta", "Dżdżysty", "Kość", "Wątpię", "Sprzączka", "Żółć",
    ],
  },
};

export type WordSetId = keyof typeof WORD_SETS;
