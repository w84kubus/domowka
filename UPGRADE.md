# Domówka v2 — brief modernizacyjny dla Claude Code

> **Jak tego użyć:** zapisz ten plik jako `UPGRADE.md` w rootcie repo obok `SPEC.md` i `CLAUDE.md`.
> Odpal `claude`, włącz Plan Mode (`Shift+Tab` ×2) i wklej:
> `Przeczytaj @UPGRADE.md w całości. Wykonaj Fazę A. Nie przechodź dalej bez mojego OK.`
> Jedna faza = jedna sesja. Między fazami `/clear`.

---

## 0. Kontekst

Aplikacja **istnieje i działa** — jest wdrożona na `domowka.vercel.app`. Repo zawiera `SPEC.md` (pełna specyfikacja funkcjonalna, sekcje 1–12) oraz `CLAUDE.md` (zasady nienegocjowalne). Oba dokumenty **nadal obowiązują** i mają pierwszeństwo przed tym plikiem w kwestiach zasad gier i architektury bezpieczeństwa.

Ten dokument nie zastępuje `SPEC.md`. Opisuje **drugi etap**: przejście od „działa" do „wygląda i zachowuje się jak produkt komercyjny".

**Nie przepisujesz aplikacji od zera.** Refaktoryzujesz, uzupełniasz i dopieszczasz istniejący kod. Każda decyzja o wyrzuceniu istniejącego modułu wymaga mojej zgody i uzasadnienia.

### Źródła

Ten dokument jest samowystarczalny. Nie polegaj na zewnętrznych skillach ani pluginach — jeśli jakieś są zainstalowane, możesz z nich skorzystać pomocniczo, ale **wymagania z sekcji B są nadrzędne**. Gotowe wzorce PWA z internetu i z generycznych ściągawek prawie zawsze zakładają statyczną stronę i cache-first na wszystkim; tutaj to błąd krytyczny (patrz B2).

Gdy czegoś nie wiesz na pewno — sprawdź aktualną dokumentację (MDN, docs Next.js, docs Serwista), a nie pamięć. Wersje bibliotek i API przeglądarek zmieniają się szybciej niż przykłady krążące w sieci.

---

## 1. Cel biznesowy

Trzy zdania, do których wracaj przy każdej decyzji:

1. Ktoś obcy wchodzi na `domowka.vercel.app` na imprezie, dostaje kod pokoju od znajomego i **w 15 sekund gra**. Bez instrukcji, bez konta, bez zastanawiania się, gdzie kliknąć.
2. Aplikacja **wygląda jak coś, za co ktoś zapłacił** — nie jak projekt weekendowy. Poziom odniesienia: Jackbox Party Pack, Kahoot, Gartic Phone.
3. Nic się nie sypie. Telefon zablokowany na 2 minuty, gracz wraca — jest w grze, na swoim miejscu, ze swoją rolą.

Wszystko poniżej służy tym trzem zdaniom.

---

## 2. Faza A — audyt. Nie piszesz kodu.

Zanim cokolwiek zmienisz, przeczytaj repozytorium i wyprodukuj plik `AUDIT.md`. To jedyny deliverable tej fazy.

### Co ma zawierać

**A1. Stan faktyczny.** Drzewo katalogów z komentarzem: co robi każdy moduł. Które gry z `SPEC.md` są zaimplementowane w pełni, które częściowo, których nie ma. Które fazy 0–8 są realnie domknięte, a które tylko odhaczone.

**A2. Rozjazd ze specyfikacją.** Konkretna lista miejsc, gdzie kod robi coś innego niż `SPEC.md`. Dla każdego: plik, linia, na czym polega różnica, czy to bug czy świadoma decyzja.

**A3. Audyt bezpieczeństwa — priorytetowy.** Reguła „klient nigdy nie zapisuje stanu gry" jest fundamentem Mafii i Impostora. Sprawdź i udowodnij:
- Czy istnieje **jakakolwiek** ścieżka zapisu do Firestore z klienta z pominięciem Route Handlerów?
- Czy `firestore.rules` faktycznie blokują odczyt `secret/*`? Wypisz aktualne reguły i przeanalizuj je linia po linii.
- Czy do `publicState` nie wycieka nic, co powinno być tajne? Przejrzyj **każdy** kształt dokumentu publicznego.
- Czy Route Handlery walidują, że akcję wykonuje gracz, który ma prawo ją wykonać w tej fazie? Wskaż endpointy bez walidacji.
- Czy klucze Admin SDK są wyłącznie po stronie serwera i nie ma ich w bundlu? Sprawdź `NEXT_PUBLIC_*`.

**A4. Audyt PWA.** Czy `manifest.json` istnieje i jest kompletny. Czy jest service worker. Czy aplikacja instaluje się na iOS i Androidzie. Czy działa cokolwiek offline. Wynik: lista braków, nie ocena opisowa.

**A5. Audyt realtime.** Co się dzieje, gdy: gracz odświeży stronę w trakcie nocy w Mafii; telefon zablokuje ekran na 3 minuty; host zamknie kartę; sieć padnie na 20 sekund; gracz kliknie dwa razy ten sam przycisk. Dla każdego scenariusza: co dzieje się teraz w kodzie i co powinno.

**A6. Wydajność.** Rozmiar bundla per route (`next build` + analiza). Liczba odczytów Firestore na jedną rozgrywkę 8-osobową — policz, nie szacuj. Największe zależności. Fonty: ile plików, jakie subsety, czy jest `latin-ext`.

**A7. Jakość kodu.** Pokrycie testami silników gier. Czy `tsconfig` jest realnie `strict`. Miejsca z `any`, `@ts-ignore`, `eslint-disable`. Duplikacja logiki między grami, która powinna być w rdzeniu.

**A8. Dług i ryzyko.** Uporządkowana lista: `[KRYTYCZNE]` (psuje grę lub ujawnia tajne dane), `[WAŻNE]` (widoczne dla użytkownika), `[NICE]` (kosmetyka). Przy każdym: szacowany koszt naprawy w liniach kodu i plikach.

### Zasady Fazy A

- **Zero commitów. Zero zmian w plikach poza `AUDIT.md`.**
- Nie zgaduj. Jeśli czegoś nie da się ustalić z kodu — wypisz jako pytanie do mnie.
- Nie pisz „prawdopodobnie", „wygląda na to, że". Sprawdź i napisz jak jest.
- Na koniec: **lista pytań do mnie** i propozycja kolejności faz B–G z uzasadnieniem, dlaczego właśnie taka.

**Poczekaj na moje OK.**

---

## 3. Faza B — PWA na poważnie

Dziś to strona internetowa. Ma być aplikacją, którą wrzuca się na ekran główny i która zachowuje się jak natywna.

### B1. Manifest i ikony
- `manifest.json` kompletny: `name`, `short_name` (max 12 znaków, mieści się pod ikoną), `description`, `id`, `start_url`, `scope`, `display: "standalone"`, `orientation: "portrait"`, `background_color`, `theme_color`, `categories: ["games"]`, `lang: "pl"`, `dir: "ltr"`.
- Ikony: 192×192 i 512×512 w wariancie `any` **oraz osobne `maskable`** z bezpiecznym marginesem 10% na krawędziach. Bez maskable Android przytnie logo.
- `apple-touch-icon` 180×180 — bez przezroczystości, iOS wypełni ją czernią.
- `theme-color` w dwóch wariantach przez `media="(prefers-color-scheme: ...)"`.
- Skróty (`shortcuts`): „Nowy pokój" i „Dołącz do pokoju" — pojawią się po długim przytrzymaniu ikony.

### B2. Service worker
- Użyj **Serwist** (`@serwist/next`). Nie używaj `next-pwa` — jest nieutrzymywany od lat i psuje się na Next 15.
- Strategie: `NetworkFirst` dla dokumentów HTML, `CacheFirst` dla fontów i ikon z długim `maxAgeSeconds`, `StaleWhileRevalidate` dla statyków.
- **Nie cache'uj niczego z Firestore ani z Route Handlerów.** Stan gry musi być zawsze świeży. To nie jest optymalizacja do zrobienia „przy okazji" — cache'owany stan gry to zbugowana gra. Uwaga: domyślny, podręcznikowy wzorzec service workera stosuje cache-first do **każdego** żądania. Tutaj jest nie do użycia. Wyklucz `/api/*` oraz domeny Google/Firebase z obsługi przez service workera na poziomie routingu, nie przez `if` w środku handlera.
- Ekran offline: dedykowana strona z jasnym komunikatem, nie domyślny dinozaur. Tekst w stylu aplikacji, nie przeprosiny.

### B3. Instalacja
- Przechwyć `beforeinstallprompt`, pokaż własny, dyskretny przycisk „Zainstaluj" — nie natrętny banner na całą szerokość, tylko element w rogu lobby.
- iOS nie wspiera `beforeinstallprompt`. Wykryj Safari na iOS i pokaż jednorazową, zamykalną podpowiedź z ilustracją: Udostępnij → Dodaj do ekranu początkowego.
- Wykrywaj tryb standalone (`display-mode: standalone`) i wtedy nie pokazuj niczego z powyższych.
- Zapamiętaj odrzucenie w `localStorage` i nie pytaj drugi raz przez 30 dni.

### B4. Zachowanie natywne
- **Wake Lock API** — ekran nie gaśnie w trakcie gry. Zwolnij blokadę po wyjściu z gry i przy `visibilitychange`. Fallback na iOS < 16.4: nie kombinuj z ukrytym wideo, po prostu odpuść.
- `viewport-fit=cover` + `env(safe-area-inset-*)` — treść nie chowa się pod notchem ani pod paskiem gestów.
- `user-scalable=no` na ekranach gry (nie na całej aplikacji — to psuje dostępność tam, gdzie jest tekst).
- `overscroll-behavior: none` — koniec z bounce'em przy przewijaniu na iOS.
- `100dvh` wszędzie. Nigdzie `100vh`.
- `touch-action: manipulation` na przyciskach — usuwa 300 ms opóźnienia i double-tap zoom.
- Obsługa `visualViewport` przy otwartej klawiaturze (Państwa-miasta, Wisielec): pole wejściowe nie może chować się pod klawiaturą.
- Wibracja (`navigator.vibrate`) jako feedback przy kluczowych akcjach — krótka, 10–20 ms. Z możliwością wyłączenia.

---

## 4. Faza C — realtime, który się nie sypie

To jest różnica między demem a produktem. Każdy punkt niżej to scenariusz, który **wydarzy się na pierwszej prawdziwej imprezie**.

### C1. Rozłączenia i powroty
- **Heartbeat**: każdy klient co 5 s aktualizuje `lastSeen` w swoim dokumencie gracza. Serwer traktuje >20 s jako rozłączenie.
- **Widoczna obecność**: w lobby i w grze przy każdym graczu status — online / rozłączony / zrezygnował. Gracze muszą wiedzieć, czy czekają na kogoś, kto wróci, czy na kogoś, kto poszedł po piwo.
- **Powrót do gry**: wejście na `/` z aktywną sesją w `localStorage` (tylko kod pokoju + nick, nigdy stan gry) → automatyczna propozycja „Wróć do pokoju XYZW". Po powrocie gracz ląduje dokładnie tam, gdzie był, ze swoją rolą.
- **Migracja hosta**: host rozłączony >30 s → uprawnienia przechodzą na gracza z najdłuższym stażem w pokoju. Wszyscy dostają o tym komunikat. Zaimplementuj to po stronie serwera, nie przez wyścig klientów.
- **Timeout fazy**: żadna faza nocy nie może zablokować się przez jednego niereagującego gracza. Po upływie limitu serwer podejmuje decyzję domyślną i idzie dalej. To już jest w `SPEC.md` — zweryfikuj, że działa dla **każdej** roli.

### C2. Idempotencja i wyścigi
- Każda akcja klienta niesie `actionId` (UUID generowany raz, przy pierwszym kliknięciu). Serwer odrzuca duplikaty. Dwuklik nie może oddać dwóch głosów.
- Zapisy do Firestore w transakcjach tam, gdzie liczy się kolejność (głosowanie, rozliczenie nocy).
- Blokada UI natychmiast po kliknięciu, odblokowanie po potwierdzeniu z serwera lub po timeoucie z komunikatem błędu.

### C3. Czas
- Korekta offsetu zegara jest w `SPEC.md` — zweryfikuj, że działa również **po powrocie z tła**. Telefon uśpiony na 5 minut wraca z rozjechanym `performance.now()`.
- Timery renderuj przez `requestAnimationFrame`, nie `setInterval`.
- Timer musi pokazywać tę samą wartość u wszystkich (±1 s), również u gracza, który właśnie dołączył w połowie fazy.

### C4. Odporność listenerów
- Każdy `onSnapshot` ma sprzątanie w `useEffect`. Sprawdź **wszystkie** — wyciekający listener to rosnący rachunek za Firestore i dziwne bugi po nawigacji.
- Ponowne łączenie z wykładniczym backoffem, nie w pętli.
- Globalny stan połączenia w UI: cienki pasek u góry „Brak połączenia — próbuję wrócić", znikający sam. Nie modal. Modal blokuje grę, której gracz może już nie kontrolować.

---

## 5. Faza D — wygląd. To jest sedno.

**To jest faza, która decyduje, czy aplikacja wygląda profesjonalnie.** Traktuj ją jak zlecenie od klienta, który odrzucił już trzy poprzednie propozycje jako „szablonowe".

### D1. Najpierw plan, dopiero potem kod

Zanim napiszesz linijkę CSS, przedstaw mi **plan wizualny** i poczekaj na akceptację. Plan zawiera:

**Paleta** — 5–7 nazwanych wartości hex z uzasadnieniem roli każdej. Nie „primary/secondary", tylko nazwy związane z tematem.

**Typografia** — trzy role: display (charakterny, używany oszczędnie), body (czytelny na małym ekranie w słabym świetle, bo tak się gra na imprezie), utility (liczby, timery, kody pokoju — koniecznie tabularne cyfry, żeby timer nie skakał). **Każdy font musi mieć `latin-ext`.** Podaj skalę typograficzną z konkretnymi rozmiarami i wagami.

**Layout** — koncepcja siatki, wireframe ASCII dla trzech kluczowych ekranów: wejście, lobby, ekran gry.

**Signature** — jeden element, po którym ta aplikacja będzie rozpoznawalna. Coś, czego nie ma nikt inny.

### D2. Czego unikać — kalibracja

Aktualne AI-generowane interfejsy zbiegają się do trzech wyglądów. Wszystkie trzy są **domyślne, nie wybrane**:

1. Kremowe tło (~`#F4F1EA`), kontrastowy szeryf, terakotowy akcent (~`#D97757`).
2. Prawie-czarne tło z jednym jaskrawym akcentem — kwaśna zieleń albo cynober.
3. Gazetowy layout z włosowymi liniami, zerowym `border-radius` i gęstymi kolumnami.

Pierwotny kierunek w `SPEC.md` — „dark neon arcade" — jest niebezpiecznie blisko wariantu 2. **Nie porzucaj go, dopracuj go tak, żeby przestał być domyślny.** Neon to nie jest `#00FF00` na `#000000` z `box-shadow` w tym samym kolorze. Neon to zjawisko fizyczne: rurka ma temperaturę barwową, świeci nierównomiernie, odbija się od otoczenia, gaśnie z bezwładnością, brzęczy. Poszukaj charakteru w tym, czym rzeczywiście jest domówka: półmrok, ekrany telefonów jako jedyne źródło światła, hałas, plastikowe kubki, ktoś krzyczy „kto zabił?". To jest materiał na tożsamość wizualną, nie abstrakcyjne „ciemny motyw z akcentem".

Zaryzykuj w **jednym** miejscu. Reszta ma być cicha i zdyscyplinowana.

### D3. System, nie zbiór ekranów
- Tokeny w Tailwind v4 (`@theme`): kolory, skala odstępów, promienie, cienie, czasy i krzywe animacji. Zero wartości hex bezpośrednio w komponentach.
- Skala odstępów: jedna, konsekwentna. Jeśli w kodzie znajdzie się `mt-[13px]` — coś jest nie tak z systemem.
- Biblioteka komponentów: `Button` (warianty i rozmiary), `Card`, `PlayerTile`, `Timer`, `RoomCode`, `PhaseHeader`, `Toast`, `Sheet`. Każdy komponent ma **wszystkie** stany: domyślny, hover, aktywny, focus-visible, disabled, loading.
- Kod pokoju to element pierwszej klasy: duży, monospace, z jednym kliknięciem do skopiowania i kodem QR do zeskanowania. To najczęściej używana funkcja w całej aplikacji — na imprezie nikt nie przepisuje kodu, wszyscy skanują.

### D4. Stany, o których zwykle się zapomina
Dla **każdego** ekranu zaprojektuj: ładowanie (skeleton dopasowany kształtem do treści, nie spinner), pusto (zaproszenie do działania, nie komunikat), błąd (co się stało i co teraz zrobić), rozłączenie, koniec gry.

Komunikaty błędów: bez przepraszania, bez ogólników. Nie „Wystąpił błąd", tylko „Ten pokój już nie istnieje. Poproś o nowy kod." Interfejs mówi konkretnie, co się stało i co dalej.

### D5. Ruch
- Przejścia między fazami gry to moment dramaturgiczny — noc zapada, dzień wstaje, głosowanie się kończy. To ma być zaaranżowana sekwencja, nie `fade 200ms`.
- Mikro-interakcje: naciśnięcie przycisku, dołączenie gracza do lobby, tyknięcie ostatnich 5 sekund timera.
- **Oszczędnie.** Nadmiar animacji to główny sygnał, że interfejs wygenerowała maszyna. Jedna dopracowana sekwencja bije dziesięć rozrzuconych efektów.
- `prefers-reduced-motion` respektowane wszędzie — animacje wyłączone, nie skrócone.
- Konfetti tylko przy realnym zwycięstwie. Nie przy każdym kliknięciu.

### D6. Dźwięk
- Krótki, spójny zestaw: dołączenie gracza, start fazy, tykanie ostatnich sekund, zwycięstwo, porażka. Jeden charakter brzmieniowy, nie zlepek z różnych paczek.
- Wyciszenie dostępne z każdego ekranu, stan zapamiętany.
- Web Audio API, nie `<audio>` — iOS blokuje odtwarzanie bez interakcji użytkownika. Odblokuj kontekst przy pierwszym kliknięciu.
- Dźwięk nigdy nie jest jedynym nośnikiem informacji. Grający z wyciszonym telefonem musi widzieć wszystko.

### D7. Ekran hosta (TV/laptop)
Osobny layout, nie skalowany telefon. Duża typografia czytelna z 3 metrów, lista graczy, timer, aktualna faza. To jest ekran, na który patrzy cały pokój — ma robić wrażenie.

---

## 6. Faza E — wydajność

Cele, nie życzenia. Zmierz i pokaż wyniki:

- Lighthouse mobile: **Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, PWA: zaliczone.**
- First Load JS dla `/` — poniżej 150 kB. Silniki gier ładowane dynamicznie (`next/dynamic`), nie w głównym bundlu.
- Fonty: `next/font` z subsetem `latin-ext`, `display: swap`, preload tylko dla display i body. Zero CLS przy podmianie fontu.
- Odczyty Firestore: policz je dla partii Mafii 8-osobowej. Jeśli wychodzi więcej niż ~300 na rozgrywkę — zoptymalizuj kształt dokumentów, nie liczbę listenerów.
- Obrazy przez `next/image`, format AVIF/WebP.
- Test na realnym urządzeniu w dławionej sieci (Slow 4G, CPU 4× slowdown). Nie tylko na desktopie.

---

## 7. Faza F — jakość i testy

- **Testy silników** (Vitest): pełna partia od `init()` do `isFinished()` dla każdej gry. Silnik jest czystą funkcją — testuje się go bez mocków.
- **Testy rozliczenia nocy w Mafii**: lekarz ratuje, barman przekierowuje, snajper pudłuje i ginie z ofiarą, szeryf blokuje, reakcje łańcuchowe. Każdy przypadek osobno.
- **Testy E2E (Playwright)** — kluczowe: użyj **osobnych kontekstów przeglądarki** dla każdego gracza. Jeden kontekst = jeden anonimowy `uid`. Bez tego nie przetestujesz multiplayera. Scenariusze: pełna partia 4-osobowa; gracz odświeża stronę w trakcie nocy i wraca; host wychodzi i następuje migracja.
- **Test bezpieczeństwa**: automat, który przechodzi rozgrywkę Mafii i zrzuca **wszystko**, co klient jest w stanie odczytać z Firestore, a potem sprawdza, że nie ma tam ról ani tajnych haseł. To jest test regresyjny na najważniejszą zasadę projektu.
- `tsconfig` realnie strict, zero `any` w kodzie produkcyjnym.
- Error boundary per trasa gry — awaria jednej gry nie wywala całej aplikacji.
- Logowanie błędów po stronie serwera z kodem pokoju i fazą w kontekście. Bez nicków i bez identyfikatorów graczy.

---

## 8. Faza G — dopracowanie

Dopiero po A–F. W kolejności wartości:

- Kod QR do pokoju + `navigator.share` — dołączenie jednym skanem.
- Deep link `/?kod=XYZW`, który przechodzi prosto do ekranu nicka.
- „Rekordy pokoju" — kto ile razy wygrał, najszybszy refleks w Stoperze, najlepszy impostor. Trwałe w obrębie pokoju.
- Awatary: kurowana paleta emoji + kolor, unikalne w obrębie pokoju.
- Tryb obserwatora dla osoby, która dołączyła w trakcie partii.
- Ekran zasad każdej gry — dostępny z lobby, jedna karta, bez ściany tekstu.

---

## 9. Zasady pracy

1. **Jedna faza na sesję.** Między fazami `/clear`. Nie próbuj domknąć trzech faz naraz — kontekst się rozjedzie i zaczniesz psuć to, co już działało.
2. **Plan przed kodem.** Na początku każdej fazy: lista plików do zmiany, kolejność, ryzyka. Czekasz na moje OK.
3. **Osobna gałąź na fazę** (`upgrade/b-pwa`, `upgrade/c-realtime`...). Commity atomowe, komunikaty po polsku, tryb rozkazujący.
4. **Po każdej fazie aktualizujesz sekcję „Aktualny stan" w `CLAUDE.md`.**
5. **Nie zmieniasz zasad gier.** Jeśli coś w `SPEC.md` jest niejasne lub sprzeczne z kodem — pytasz, nie zgadujesz.
6. **Nie dodajesz zależności bez pytania.** Przy każdej propozycji: co daje, ile waży, kto ją utrzymuje, kiedy ostatni commit.
7. **Nie refaktoryzujesz „przy okazji".** Refaktor jest osobnym zadaniem z osobnym uzasadnieniem.
8. Jeśli w trakcie fazy odkryjesz coś `[KRYTYCZNE]` z audytu — zatrzymujesz się i mówisz mi. Nie naprawiasz po cichu.

---

## 10. Definition of Done — będę to sprawdzał

**Bezpieczeństwo**
- [ ] Przejście całej partii Mafii z otwartymi DevToolsami i przejrzenie wszystkiego, co klient może odczytać, **nie ujawnia ról ani tajnego hasła**.
- [ ] Żadna ścieżka zapisu stanu gry nie omija Route Handlerów.
- [ ] `firestore.rules` przetestowane emulatorem, z testami w repo.

**Niezawodność**
- [ ] Odświeżenie strony w dowolnym momencie gry → gracz wraca na swoje miejsce, ze swoją rolą.
- [ ] Telefon zablokowany na 3 minuty → powrót bez utraty stanu, z poprawnym timerem.
- [ ] Rozłączenie gracza w nocy nie blokuje gry.
- [ ] Wyjście hosta → migracja w ciągu 30 s, wszyscy poinformowani.
- [ ] Dwuklik na przycisku nie powoduje podwójnej akcji.
- [ ] Timer identyczny u wszystkich (±1 s), też u gracza z rozjechanym zegarem systemowym.

**PWA**
- [ ] Instaluje się na Androidzie (Chrome) i iOS (Safari), ikona bez artefaktów i bez przycięcia.
- [ ] W trybie standalone brak paska adresu, safe-area obsłużone.
- [ ] Ekran nie gaśnie w trakcie gry.
- [ ] Offline pokazuje własny ekran, nie błąd przeglądarki.

**Wygląd**
- [ ] Plan wizualny zaakceptowany przed implementacją i wdrożony dokładnie.
- [ ] Wszystkie polskie znaki (Ą Ć Ę Ł Ń Ó Ś Ź Ż) renderują się we wszystkich fontach i wagach.
- [ ] Każdy ekran ma stany: ładowanie, pusto, błąd, rozłączenie.
- [ ] Cele dotykowe min. 56 px. `prefers-reduced-motion` respektowane. Focus widoczny przy nawigacji klawiaturą.
- [ ] Przetestowane na realnym iPhone Safari **i** Android Chrome. Nie w emulatorze DevToolsów.

**Wydajność i kod**
- [ ] Lighthouse mobile spełnia progi z Fazy E — załącz zrzuty.
- [ ] Każda gra ma test pełnej partii. Mafia ma testy rozliczenia nocy.
- [ ] Playwright: partia 4-osobowa w osobnych kontekstach przechodzi.
- [ ] Dodanie nowej gry = jeden folder + jedna linia w `registry.ts`. Bez zmian w rdzeniu.

---

## 11. Czego nie robić

- Nie przepisuj aplikacji od zera.
- Nie cache'uj stanu gry w service workerze.
- Nie trzymaj stanu gry w `localStorage` (tylko kod pokoju, nick i preferencje).
- Nie dodawaj kont, logowania, e-maili, czatu tekstowego.
- Nie rób landing page'a z marketingiem. Wejście = dwa przyciski.
- Nie generuj list haseł i kategorii programowo. Jakość haseł to połowa jakości gry.
- Nie dokładaj bibliotek do animacji „dla efektu". Framer Motion już jest.
- Nie zamieniaj funkcjonującej gry na „lepszą wersję" bez pytania.
- Nie oznaczaj punktu z Definition of Done jako zrobiony, jeśli go nie sprawdziłeś na urządzeniu.

---

## 12. Zaczynasz

Wykonaj **wyłącznie Fazę A**. Zbuduj `AUDIT.md`. Zadaj pytania. Zaproponuj kolejność faz.

Nie pisz kodu, dopóki nie powiem OK.
