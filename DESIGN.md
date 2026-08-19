# DESIGN.md — system wizualny "Arcade Party"

Ten plik jest **jedynym źródłem prawdy o wyglądzie aplikacji**. Każdy nowy komponent
musi używać tokenów i receptur stąd. Nie wymyślaj własnych kolorów, cieni ani promieni.

Referencje wizualne (screeny) leżą w `design/refs/`. Otwórz je przed pracą nad UI.

---

## 0. Kierunek

Kreskówkowy arcade / "gra imprezowa": soczysty fioletowo-różowy gradient, grube białe
obwódki, klocowate przyciski 3D z twardym cieniem, zaokrąglone bąbelkowe litery,
panele jak naklejki. Zero flat-minimalizmu, zero cienkich kresek 1px, zero szarości.

**Element sygnaturowy:** twardy, nierozmyty cień pod każdym interaktywnym elementem
(`box-shadow: 0 4px 0 <ciemniejszy odcień>`) + wciśnięcie przycisku o te 4px przy
`:active`. To jedna rzecz, która ma sprzedawać cały styl.

---

## 1. Tokeny — Tailwind v4 (`app/globals.css`)

```css
@import "tailwindcss";

@theme {
  /* Tło i rama */
  --color-frame:        #140A24;  /* czarno-fioletowa rama poza kartą aplikacji */
  --color-bg-1:         #4B1FA8;  /* gradient: lewy górny */
  --color-bg-2:         #7A2CC0;  /* gradient: środek */
  --color-bg-3:         #C0398F;  /* gradient: prawy dolny */

  /* Marka */
  --color-primary:      #6D3BF5;  /* wypełnienie przycisku głównego */
  --color-primary-deep: #3A1B9B;  /* twardy cień pod przyciskiem */
  --color-primary-soft: #9B7BFF;  /* hover / poświata */

  /* Akcent (nagłówki sekcji, aktywne zakładki) */
  --color-mint:         #7CF0AE;
  --color-mint-deep:    #2FA96B;

  /* Powierzchnie na gradiencie */
  --color-panel:        rgb(255 255 255 / 0.12);
  --color-panel-hi:     rgb(255 255 255 / 0.20);
  --color-stroke:       rgb(255 255 255 / 0.28);

  /* Arkusz (modale) */
  --color-sheet:        #FFFFFF;
  --color-sheet-ink:    #2A1758;

  /* Tekst */
  --color-ink:          #FFFFFF;
  --color-ink-muted:    #E3D4F7;

  /* Typografia */
  --font-display: "Baloo 2", ui-rounded, system-ui, sans-serif;
  --font-body:    "Nunito", ui-rounded, system-ui, sans-serif;

  /* Promienie */
  --radius-btn:   14px;
  --radius-card:  20px;
  --radius-app:   28px;

  /* Cienie — zawsze twarde, blur = 0 */
  --shadow-hard:    0 4px 0 var(--color-primary-deep);
  --shadow-hard-sm: 0 3px 0 rgb(0 0 0 / 0.35);
  --shadow-lift:    0 18px 40px rgb(0 0 0 / 0.35);
}
```

**Fonty:** `next/font/google` — `Baloo 2` (600/700/800, display) i `Nunito` (600/800, body).
Oba mają `latin-ext`, więc polskie znaki (ą ć ę ł ń ó ś ź ż) działają — ustaw
`subsets: ["latin", "latin-ext"]`. Bez tego diakrytyki wypadną na fallback i całość
się rozjedzie.

> **Dlaczego nie Fredoka.** Pierwotnie ten dokument wskazywał Fredokę. Ma ona glify
> `latin-ext`, więc automatyczny test „czy są polskie znaki" przechodzi — ale rysuje
> je źle: ogonek w Ą/Ę to cienki włos oderwany od litery, a kreska w Ź/Ć/Ń/Ś jest
> zbyt cienka i odsunięta w prawo. Przy grubym, klocowatym stylu Arcade wygląda to
> jak inny font wklejony w środek wyrazu. **Sama obecność glifów to za mało — sprawdzaj,
> czy diakrytyki trzymają wagę pisma.** Baloo 2 ma je grube i doklejone.

---

## 2. Skala typograficzna

| Rola | Font | Rozmiar | Waga | Uwagi |
|---|---|---|---|---|
| Logo / H1 | Fredoka | 40–56px | 700 | UPPERCASE, `tracking-wide`, biały outline |
| Nagłówek sekcji | Fredoka | 22–28px | 700 | UPPERCASE, kolor `mint` |
| Nagłówek panelu | Fredoka | 18–22px | 600 | UPPERCASE |
| Etykieta przycisku | Fredoka | 16–18px | 700 | UPPERCASE, `tracking-[0.06em]` |
| Body | Nunito | 16–18px | 600 | sentence case, `leading-relaxed` |
| Podpis / meta | Nunito | 13–14px | 700 | UPPERCASE, `opacity-70` |

Zasada: **wszystko, co jest sterowaniem (przycisk, zakładka, nagłówek) — wersaliki
Fredoka. Wszystko, co się czyta zdaniami — Nunito.** Nie mieszaj.

---

## 3. Tło strony

Trzy warstwy, w tej kolejności:

1. `--color-frame` na `<body>` — całość aplikacji to karta o `--radius-app`
   wpuszczona w ciemną ramę z marginesem ~16–24px.
2. Gradient diagonalny wewnątrz karty:
   `linear-gradient(135deg, var(--color-bg-1) 0%, var(--color-bg-2) 45%, var(--color-bg-3) 100%)`
3. Tekstura halftone (kropki) — subtelna, `opacity: 0.10`, `pointer-events-none`:

```css
.halftone {
  background-image: radial-gradient(rgb(255 255 255 / 0.5) 1px, transparent 1px);
  background-size: 6px 6px;
  opacity: 0.10;
}
```

Opcjonalnie winieta: `radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.28) 100%)`.

---

## 4. Receptury komponentów

### 4.1 Przycisk (`Button`)

```tsx
// wariant "primary"
"font-display uppercase tracking-[0.06em] text-lg font-bold text-white",
"px-8 py-4 rounded-[14px]",
"bg-primary border-[3px] border-white/90",
"shadow-[0_4px_0_var(--color-primary-deep)]",
"transition-transform duration-75",
"hover:brightness-110",
"active:translate-y-[4px] active:shadow-none",
"focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint focus-visible:outline-offset-2",
"disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0"
```

Warianty:
- `primary` — fiolet + biała obwódka (akcja główna, jedna na ekran).
- `ghost` — `bg-white/90 text-sheet-ink`, cień `--shadow-hard-sm` (akcje drugorzędne,
  np. DISCORD / TWITCH).
- `icon` — kwadrat 56×56, ten sam cień, ikona 24px `stroke-width: 2.5`.

Ikona zawsze **po lewej** od etykiety, odstęp 10px.

### 4.2 Panel / karta

```tsx
"rounded-[20px] bg-panel backdrop-blur-sm",
"border-2 border-stroke",
"shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_18px_40px_rgb(0_0_0/0.35)]",
"p-6"
```

### 4.3 Zakładki "teczkowe"

Zakładki siedzą **na górnej krawędzi panelu i są z nim zrośnięte** (bez odstępu):
- aktywna: `bg-panel-hi`, tekst `mint`, `rounded-t-[16px]`, brak dolnej krawędzi;
- nieaktywna: `bg-black/15`, tekst `ink-muted`, lekko niższa (`mt-1`).

Realizacja: kontener `flex` z `gap-1`, panel poniżej ma `rounded-t-none` po stronie
aktywnej zakładki.

### 4.4 Modal — "arkusz z zeszytu"

- Overlay: `bg-black/60`.
- Arkusz: `bg-sheet`, `rounded-[20px]`, `max-w-[720px]`, `shadow-lift`.
- Pasek nagłówka: `bg-primary`, tytuł wersalikami na biało, X po prawej (48×48).
- **Spirala u góry:** dwa lub trzy „pierścienie” — elementy absolutnie pozycjonowane
  nad arkuszem: `w-8 h-14 rounded-full border-[6px] border-white/80`, obrócone
  `rotate-[-12deg]`, `top: -28px`.
- **Stos kartek u dołu:** 2–3 pseudo-warstwy `absolute inset-x-3 -bottom-1 h-2`
  `bg-white/70 rounded-b-[16px]`, każda węższa o 8px.
- Lista wewnątrz: siatka 3-kolumnowa, każdy element to `rounded-[12px] border-2
  border-black/10 py-4`, wybrany dostaje ✓ i kolor `primary`.

### 4.5 Awatar / slot gracza

Koło 96px, `border-[6px] border-white`, wewnątrz obrazek postaci, pod spodem twardy
cień. Pusty slot: `bg-white/10`, ikona-placeholder `opacity-40`, tekst „PUSTE”.

---

## 5. Ruch

- Przyciski: tylko `translate-y` przy `:active`, 75 ms, bez easingu fantazyjnego.
- Wejście modala: `scale(0.96) → 1` + `opacity`, 160 ms `ease-out`.
- Hover kart: `translate-y(-2px)` + jaśniejsza obwódka. Nic więcej.
- **Obowiązkowo:** `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`

Żadnych ciągłych pulsowań, floatów i parallaxów — od tego styl robi się tandetny.

---

## 6. Layout

Desktop: karta aplikacji `max-w-[1200px]`, wewnątrz siatka `grid-cols-12`:
- lewa kolumna 7/12 — panel główny z zakładkami,
- prawa 5/12 — panel pomocniczy („JAK GRAĆ”) z karuzelą i kropkami paginacji.

Mobile (< 768px): jedna kolumna, panel pomocniczy pod głównym, przyciski `w-full`,
ramka aplikacji zmniejsza margines do 8px, `--radius-app` do 20px.

Stopka: linki wersalikami, `opacity-60`, separatory `|`.

---

## 7. Copy (PL)

- Etykiety przycisków = czasownik + rzecz: „ZACZNIJ GRĘ”, „ZAPROŚ ZNAJOMYCH”.
- Nazwa akcji nie zmienia się w trakcie flow (przycisk „OPUBLIKUJ” → toast
  „Opublikowano”).
- Pusty ekran to zaproszenie do działania, nie komunikat o braku: zamiast
  „Brak graczy” → „Zaproś znajomych i zaczynajcie”.
- Błędy mówią, co się stało i co zrobić. Bez przepraszania.

---

## 8. Checklista akceptacji (sprawdź przed zamknięciem zadania)

- [ ] Żaden kolor w kodzie nie jest zapisany na sztywno — wszystko przez zmienne z `@theme`.
- [ ] Każdy przycisk ma twardy cień i wciska się przy `:active`.
- [ ] Wszystkie etykiety sterowania są wersalikami we Fredoce.
- [ ] Polskie znaki renderują się poprawnie (sprawdź „Zażółć gęślą jaźń” w nagłówku).
- [ ] Widoczny focus klawiaturowy na każdym elemencie interaktywnym.
- [ ] Kontrast tekstu na gradiencie ≥ 4.5:1 (biały tekst wymaga przyciemnienia panelu).
- [ ] Działa od 360px szerokości w górę.
- [ ] `prefers-reduced-motion` respektowane.
- [ ] Brak skopiowanych 1:1 cudzych logotypów, maskotek i ikon — tylko własne assety.

---

## 9. Zakres własności

Odwzorowujemy **kierunek stylistyczny** (paleta, klocowate przyciski, kreskówkowa
typografia, panele-naklejki). Nie kopiujemy logo, nazw, postaci ani grafik z
referencji — maskotki i ikony generujemy/rysujemy własne.
