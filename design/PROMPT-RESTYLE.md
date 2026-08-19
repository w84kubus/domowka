Tokeny Arcade Party i fonty już są wgrane (globals.css + layout.tsx mają poprawne @theme, .btn, .card, .arcade-bg, halftone). Teraz trzeba **przerobić ekrany** żeby wyglądały jak załączone mockupy z Gemini — obecny UI jest zbyt goły i minimalny.

Obejrzyj każdy załączony screenshot i przeczytaj poniższą instrukcję „jest → ma być" dla każdego ekranu. Czytaj razem z `DESIGN.md` (tokeny, receptury) i `design/IMPLEMENTATION-REFERENCE.md` (gotowy kod CSS/Tailwind).

## 📁 Zasoby na dysku

| Plik | Co zawiera |
|---|---|
| `DESIGN.md` | Źródło prawdy: tokeny, paleta, receptury komponentów, checklist |
| `design/IMPLEMENTATION-REFERENCE.md` | Gotowy kod: `.btn`, `.card`, blok `@theme`, import fontów, klasy Tailwind |
| `design/refs/*.png` | Referencje stylu z Gartic Phone |
| Załączone screeny (5 szt.) | **Mockupy Gemini** — docelowy wygląd każdego ekranu |

## 🔒 Nie ruszaj

- `src/games/*/engine.ts`, Route Handlery (`src/app/api/`), `src/lib/`, `CLAUDE.md`, `SPEC.md`
- Klient NIGDY nie pisze do Firestore
- Przyciski min. 56px, `100dvh` nie `100vh`, fonty z `latin-ext`

**Możesz** modyfikować: `src/app/*/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, wszystko w `src/components/`, client-side hooks, dodawać nowe komponenty.

---

## 🎯 Ekran po ekranie: jest → ma być

### 1. Landing page (`src/app/page.tsx`) — MOCKUP: „DOMÓWKA mobile" + „DOMÓWKA desktop"

**JEST:** Goły ekran — tytuł + podtytuł + 2 przyciski. Nic więcej.

**MA BYĆ (patrz mockupy):**
- **Hero sekcja** na górze: duży tytuł DOMÓWKA (font-display, uppercase, drop-shadow), podtytuł, dwa przyciski obok siebie (nie pionowo!) — „ZAKŁADAM POKÓJ" (primary) + „DOŁĄCZAM" (ghost z ciemnym tekstem, białe tło)
- **Sekcja „SEKCJA GIER"** pod hero: siatka kart gier. Każda gra to karta `.card` z **kolorową ramką w kolorze akcentu gry** (Stoper=limonka #CCFF00, Państwa-miasta=cyjan #22D3EE, Wisielec=bursztyn #FFB627, Impostor=magenta #FF2D95, Mafia=czerwień #E4002B). Karta zawiera: emoji, nazwę gry (bold), opis (tagline z manifestu). Mobile: siatka 2 kolumny + 1 na dole. Desktop: 5 w rzędzie.
- **Sekcja „JAK GRAĆ"** pod grami: 3 karty z krokami (1. Załóż pokój na telefonie, 2. Podaj kod znajomym, 3. Wybierz grę i grajcie!). Każda karta z numerem w kółku na górze i ikoną/emoji.
- **Stopka** na dole.
- **Dane gier bierz z `src/games/registry.ts`** — zaimportuj `GAME_LIST` i iteruj po manifestach (`.name`, `.tagline`, `.emoji`, `.accentColor`). NIE hardcoduj listy gier.
- Logika deep-linków i `<ReturnToRoom />` zostaje bez zmian.

### 2. Nowy pokój (`src/app/nowy/page.tsx` + `src/components/EntryForm.tsx`) — MOCKUP: „Nowy pokój"

**JEST:** Tytuł + prosty formularz w panelu `.card` z inputem na nick i emoji avatarami.

**MA BYĆ:**
- Tytuł „Nowy pokój" — **kolorowy gradient tekstu** (rainbow/gradient od fioletu do różu, lub outline + fill jak na mockupie)
- Panel `.card` z frosted glass — zostaje, ale dodaj:
  - Pole „Twój nick" — input z większą czcionką, szary/fioletowy bg, zaokrąglone, widoczny placeholder
  - **Siatka awatarów 2×4** z kolorowymi kafelkami. Każdy kafelek to zaokrąglony kwadrat z tłem w unikalnym kolorze i emoji zwierzątka. Wybrany awatar ma **cyjanową/miętową poświatę** (border-color: mint + box-shadow glow). Obecne emoji z `src/lib/avatars.ts` zostają — tylko zmień styl kafelków żeby każdy miał swój kolor tła (np. brąz dla niedźwiedzia-emoji, pomarańcz dla lisa, zielony dla żaby itp. — dopasuj kolory do emoji które tam są)
- Przycisk „ZAKŁADAM POKÓJ" na dole — duży, pełna szerokość, koral/różowy bg zamiast domyślnego fioletowego (użyj `--color-bg-3` lub `--color-czerwien` jako tło przycisku)

### 3. Dołącz (`src/app/dolacz/page.tsx`) — brak osobnego mockupu

Podobny styl jak „Nowy pokój": gradient tło, panel `.card` z frosted glass, pole na kod pokoju (duże kafelki-litery jak w `CodeInput`), nick, awatar, przycisk. Spójna estetyka.

### 4. Lobby / Pokój (`src/app/pokoj/[code]/page.tsx`) — MOCKUP: „POKÓJ FFLC"

**JEST:** Prosty layout: kod pokoju, QR, lista graczy, lista gier, przycisk wyjdź.

**MA BYĆ:**
- **Tytuł „POKÓJ XXXX"** — wielki, bold, z efektem outline/stroke (kolor różowy/gradient, ciemny obrys tekstu). Kod pokoju jako część tytułu, nie osobny komponent.
- **QR code** w prawym górnym rogu w szklanym panelu (nie na środku ekranu jak teraz)
- **Pasek gracza** pod tytułem — szerokie zaokrąglone pole z emoji awatara + nick. Podświetlone, frosted glass, duże.
- **Lista gier** — to jest kluczowe! Każda gra to **szeroki pasek/rząd** na pełną szerokość z:
  - Emoji po lewej
  - Nazwa gry (bold) + tire + opis (tagline)
  - Tło: frosted glass z lekkim fioletowym odcieniem
  - **Wybrana gra** ma **limonkową/miętową ramkę-glow** (border: 2px solid var(--color-mint) + box-shadow: 0 0 16px var(--color-mint))
  - Kliknięcie = wybór gry (host only)
- **Przycisk „ZACZYNAMY!"** na dole — wielki, **limonkowy/zielony** (bg: var(--color-mint) lub #CCFF00), ciemny tekst, grube zaokrąglenia, hard shadow. NIE fioletowy jak teraz.
- Konfetti/dekoracje — opcjonalnie, jeśli dasz radę dodać CSS confetti animation, super. Jeśli nie, pomiń.

### 5. Ustawienia gry (komponent w lobby) — MOCKUP: „USTAWIENIA GRY"

**JEST:** Zwykłe selecty/inputy.

**MA BYĆ:**
- Panel `.card` z tytułem „USTAWIENIA GRY"
- **Segment buttons** zamiast selectów! Dla ustawień z enum (CEL: losowy/stały, RUNDY: 3/5/7/∞, PUNKTACJA: precyzja/zwycięstwa):
  - Rząd zaokrąglonych przycisków obok siebie
  - Wybrany: ciemniejsze fioletowe tło + **limonkowa ramka** (border: 2px solid #CCFF00) + hard shadow
  - Niewybrany: jasno-fioletowe tło, delikatny hard shadow, brak ramki
  - Styl klocków — zaokrąglone, arcade-feel
- Przycisk „ZACZYNAMY!" na dole — limonkowy/zielony jak opisany wyżej
- **Stwórz komponent `SegmentPicker`** w `src/components/` — reużywalny dla różnych ustawień. Props: `options: {value: string, label: string}[]`, `value: string`, `onChange: (v: string) => void`.

---

## 🧩 Nowe komponenty do stworzenia

1. **`src/components/SegmentPicker.tsx`** — arcade segment buttons (opis wyżej)
2. **`src/components/GameCard.tsx`** — karta gry z kolorową ramką dla landing page (props: manifest)
3. **`src/components/HowToPlay.tsx`** — sekcja „Jak grać" z 3 krokami (landing page)
4. **`src/components/GameRow.tsx`** — wiersz gry w lobby (emoji + nazwa + opis, glow na wybranej)

## 🎨 Nowe klasy CSS do dodania w globals.css

```css
/* Glow selekcji — miętowa poświata na wybranym elemencie */
.glow-selected {
  border-color: var(--color-mint);
  box-shadow: 0 0 16px rgb(124 240 174 / 0.5), 0 0 4px rgb(124 240 174 / 0.3);
}

/* Przycisk limonkowy (ZACZYNAMY!) */
.btn-lime {
  background: linear-gradient(180deg, #CCFF00 0%, #A8E600 100%);
  color: #1a1a2e;
  border-color: #A8E600;
  box-shadow: 0 4px 0 #6B8F00;
  text-shadow: none;
}
.btn-lime:active {
  transform: translateY(4px);
  box-shadow: none;
}

/* Gradient tekstu (tytuł Nowy pokój) */
.text-gradient {
  background: linear-gradient(90deg, var(--color-primary-soft), var(--color-bg-3), var(--color-mint));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Karta gry — border w kolorze akcentu */
.game-card {
  border: 3px solid var(--accent);
  border-radius: var(--radius-card);
  background: rgb(255 255 255 / 0.85);
  color: var(--color-sheet-ink);
  padding: 1.25rem;
}
```

## 🧠 Audyt UX/UI — przy okazji

Przy każdym ekranie pytaj się: „Czy to jest intuicyjne? Czy coś brakuje?". Poprawiaj brakujące:
- Stany ładowania (skeleton/spinner)
- Feedback po akcjach (toast, animacja)
- Puste stany (brak graczy, brak gier)
- Animacje wejścia (arcade-pop na kartach/panelach)
- Responsywność (320px – 1440px)

## ✅ Na koniec

1. Przejdź checklistę z sekcji 8 DESIGN.md
2. `npm run typecheck` — zero błędów
3. Wylistuj wszystkie zmiany z uzasadnieniem
4. Pokaż screenshot każdego ekranu

---

*Zacznij od obejrzenia WSZYSTKICH załączonych mockupów. Potem czytaj DESIGN.md + design/IMPLEMENTATION-REFERENCE.md. Potem rób ekran po ekranie w kolejności: landing → nowy → dołącz → lobby → ustawienia gry.*
