# SPEC — „Doplay" · multiplayerowe gry imprezowe w przeglądarce

> **Jak użyć tego pliku (instrukcja dla Jakuba, nie dla Claude Code):**
> Nie wklejaj tego do czatu Claude Code. Zapisz jako `SPEC.md` w pustym repo, obok zrób `CLAUDE.md` (treść w Załączniku A), a w terminalu odpal prompt startowy z Załącznika B. Dzięki temu spec przeżyje `/compact` i `/clear` — Claude Code będzie mógł do niego wracać zamiast trzymać wszystko w kontekście.

---

## 1. Kontekst i cel

Budujemy stronę z grami imprezowymi na domówki. Grupa 3–16 znajomych siedzi w jednym pokoju, każdy ma swój telefon. Ktoś zakłada pokój, reszta dołącza kodem (albo skanuje QR), gramy.

**Twarde założenia:**

- **Wszystko po polsku.** UI, komunikaty, hasła, błędy. Zero angielszczyzny w interfejsie.
- **Mobile-first, bezwzględnie.** Telefon jest podstawowym urządzeniem. Desktop to bonus.
- **Zero rejestracji, zero logowania.** Wchodzisz, wpisujesz nick, grasz.
- **Gra się przy piwie, w półmroku, w hałasie.** Duże przyciski, wysoki kontrast, jednoznaczne stany, zero subtelności.
- **Hosting:** GitHub → Vercel. Firebase jako backend.
- **Architektura musi być rozszerzalna.** Dodanie nowej gry (warcaby, statki, kalambury) = jeden nowy folder + jedna linia w rejestrze. Zero zmian w rdzeniu.

**Gry w zakresie tego specu:**

| Gra | Katalog | Kolor sygnaturowy | Priorytet |
|---|---|---|---|
| Kółko i krzyżyk | `kolko-krzyzyk` | stal `#94A3B8` | 1 (walidacja architektury) |
| Stoper | `stoper` | limonka `#CCFF00` | 2 |
| Państwa-miasta | `panstwa-miasta` | cyjan `#22D3EE` | 3 |
| Wisielec | `wisielec` | bursztyn `#FFB627` | 4 |
| Impostor | `impostor` | magenta `#FF2D95` | 5 |
| Mafia | `mafia` | czerwień `#E4002B` | 6 (najtrudniejsza, na koniec) |

---

## 2. Stack

Trzymaj się tego. Nie podmieniaj bibliotek bez pytania.

- **Next.js 15**, App Router, TypeScript w trybie `strict`
- **React 19**
- **Tailwind CSS v4** (konfiguracja przez `@theme` w CSS, nie `tailwind.config.js`)
- **Firebase**
  - Firestore — realtime transport i stan
  - Firebase Auth — **wyłącznie Anonymous Auth**
  - `firebase-admin` w Route Handlerach Next.js
- **Zod** — walidacja każdej akcji przychodzącej z klienta
- **Zustand** — lokalny stan UI (nie stan gry!)
- **Framer Motion** — animacje
- **canvas-confetti** — zwycięstwa
- **qrcode.react** — QR z linkiem do pokoju
- **Vitest** — testy jednostkowe silników gier
- ESLint + Prettier, `npm` (nie pnpm, nie yarn)

**Czego NIE używamy:** żadnego ORM-a, żadnego Redux, żadnego Socket.io (Vercel nie utrzyma WS), żadnego backendu poza Route Handlerami, żadnej bazy poza Firestore.

---

## 3. Architektura — to jest najważniejsza sekcja, przeczytaj dwa razy

### 3.1 Zasada naczelna: klient nigdy nie pisze stanu gry

To nie jest paranoja — to warunek działania Mafii i Impostora. Gdyby role siedziały w dokumencie, który klient może odczytać, każdy gracz otworzyłby DevTools i zobaczył kto jest mafią. **Cała gra by się rozpadła.**

Dlatego:

```
KLIENT                          SERWER (Route Handler)              FIRESTORE
──────                          ──────────────────────              ─────────
akcja gracza ───POST /api/rooms/[code]/action───►
                                weryfikuj ID token
                                pobierz secret/state (admin SDK)
                                sprawdź: czy może? czy jego tura?
                                  czy faza pasuje? czy version się zgadza?
                                uruchom czysty reducer
                                zapisz:
                                  - publicState  ──────────────────► rooms/{code}
                                  - private/{uid} dla każdego ─────► rooms/{code}/private/*
                                  - secret/state ──────────────────► rooms/{code}/secret/state
                                  - event feed ────────────────────► rooms/{code}/events
       ◄──── onSnapshot (realtime, tylko odczyt) ─────────────────────────┘
```

- **Klient czyta** przez `onSnapshot`: dokument pokoju (`publicState`), swój `private/{uid}`, ostatnie 50 `events`.
- **Klient pisze**: nic. Zero. Wszystkie zapisy przez API.
- **`rooms/{code}/secret/state`** — reguły Firestore: `allow read, write: if false`. Dostęp tylko z Admin SDK.

### 3.2 Model danych w Firestore

```
rooms/{code}                        // publiczny stan pokoju
  code: string                      // "K7QM"
  createdAt / expiresAt: Timestamp  // TTL 8h
  hostUid: string
  narratorUid: string | null        // tylko Mafia w trybie z prowadzącym
  status: 'lobby' | 'playing' | 'finished'
  gameId: string | null
  settings: object                  // walidowane zodem per gra
  players: {                        // MAPA, nie tablica (łatwiejsze reguły i update'y)
    [uid]: { uid, nick, avatar, joinedAt, isHost, connected, lastSeenAt, totalScore }
  }
  seatOrder: string[]               // stabilna kolejność miejsc, losowana raz przy starcie
  round: number
  phase: string                     // nazwa fazy, zdefiniowana przez grę
  phaseStartedAt: Timestamp
  phaseEndsAt: Timestamp | null     // deadline fazy — serwerowy, jedyne źródło prawdy
  publicState: object               // stan gry widoczny dla WSZYSTKICH
  version: number                   // inkrementowany przy każdym zapisie (optimistic lock)

rooms/{code}/private/{uid}          // tajemnice konkretnego gracza
  payload: object                   // rola w Mafii, słowo w Impostorze, itd.

rooms/{code}/secret/state           // NIKT tego nie czyta z klienta
  fullState: object                 // pełny stan silnika (ze wszystkimi rolami)
  seed: number                      // ziarno PRNG

rooms/{code}/events/{autoId}        // feed zdarzeń do UI
  at: Timestamp
  type: string
  text: string                      // gotowy polski tekst, np. "Damian został wyeliminowany"
  meta: object
```

### 3.3 Reguły bezpieczeństwa (`firestore.rules`)

Napisz dokładnie takie i zdeployuj przez Firebase CLI:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }

    match /rooms/{code} {
      // Czytać pokój może tylko ktoś, kto już w nim siedzi.
      // Dołączanie idzie przez API (Admin SDK), więc to nie blokuje wejścia.
      allow read: if signedIn() && request.auth.uid in resource.data.players;
      allow write: if false;

      match /private/{uid} {
        allow read: if signedIn() && request.auth.uid == uid;
        allow write: if false;
      }

      match /secret/{doc} {
        allow read, write: if false;   // WYŁĄCZNIE Admin SDK
      }

      match /events/{id} {
        allow read: if signedIn();
        allow write: if false;
      }
    }
  }
}
```

### 3.4 Silnik gier — interfejs pluginu

To jest kontrakt. Każda gra go implementuje. **Nie dodawaj wyjątków dla konkretnej gry w rdzeniu** — jeśli jakaś gra się nie mieści, popraw interfejs, nie rdzeń.

```
src/games/
  types.ts          // GameEngine, GameManifest, konteksty
  registry.ts       // mapa id -> { manifest, engine, komponenty }
  <game-id>/
    manifest.ts
    engine.ts       // CZYSTA funkcja, zero I/O, zero Date.now(), zero Math.random()
    engine.test.ts
    Settings.tsx    // panel ustawień w lobby (widzi tylko host)
    PlayerView.tsx  // widok na telefonie
    HostView.tsx    // widok na wspólnym ekranie (opcjonalny)
    data/           // hasła, kategorie, słowa — pliki .ts
```

```typescript
export interface GameEngine<S, A, C> {
  id: string;

  /** Stan początkowy. rng z ctx, nie Math.random(). */
  init(ctx: InitContext<C>): S;

  /** Czysta, deterministyczna funkcja. Rzuca GameError przy niedozwolonej akcji. */
  reduce(state: S, action: A, ctx: ActionContext): S;

  /** Co widzą wszyscy. Tu NIE MOŻE trafić nic tajnego. */
  publicView(state: S, players: PlayerMap): unknown;

  /** Co widzi konkretny gracz (jego rola, jego karta). */
  privateView(state: S, uid: string): unknown;

  /** Nazwa aktualnej fazy + kiedy się kończy (null = bez limitu czasu). */
  phase(state: S): { name: string; endsAt: number | null };

  isFinished(state: S): boolean;
  scores(state: S): Record<string, number>;

  /** Zdarzenia do feedu, wygenerowane przez ostatnią redukcję. */
  drainEvents(state: S): GameEvent[];
}

export interface GameManifest<C = unknown> {
  id: string;
  name: string;              // "Państwa-miasta"
  tagline: string;           // jedno zdanie, po polsku
  emoji: string;
  accentColor: string;       // hex z tabeli w §1
  minPlayers: number;
  maxPlayers: number;
  supportsHostScreen: boolean;
  estimatedMinutes: [number, number];
  defaultSettings: C;
  settingsSchema: ZodType<C>;
}

export interface ActionContext {
  uid: string;               // kto wykonuje akcję
  now: number;               // czas SERWERA, wstrzyknięty przez Route Handler
  rng: () => number;         // deterministyczny PRNG (mulberry32, seed w stanie)
}
```

**Determinizm jest obowiązkowy.** Zero `Date.now()`, zero `Math.random()` wewnątrz `engine.ts`. Czas i losowość wchodzą przez `ctx`. Dzięki temu: testy są powtarzalne, a partię da się odtworzyć z logu akcji.

### 3.5 Fazy czasowe bez crona

Vercel nie ma timerów. Rozwiązanie:

1. Serwer zapisuje `phaseEndsAt` (Timestamp).
2. Klienci liczą odliczanie **lokalnie**, z korektą zegara (§3.6). Nikt nie zapisuje tikania do Firestore.
3. Gdy klient lokalnie zauważy, że `phaseEndsAt` minął, po losowym opóźnieniu **200–800 ms** strzela `POST /api/rooms/[code]/tick` z aktualnym `version`.
4. Serwer sprawdza czas **swoim** zegarem. Jeśli faza faktycznie wygasła → uruchamia reducer z akcją `PHASE_TIMEOUT`. Jeśli nie → `204 No Content`.
5. `version` zapewnia idempotencję: pierwszy tick wygrywa, reszta dostaje `409` i po cichu ignoruje.
6. Dodatkowo host wysyła `tick` co 3 s jako bezpiecznik.

### 3.6 Korekta zegara — pamiętaj o tym, bo inaczej timery będą się rozjeżdżać

Telefony mają zegary rozjechane nawet o kilkadziesiąt sekund. Odliczanie liczone z `Date.now()` będzie u każdego inne.

```
GET /api/time  ->  { now: <Date.now() na serwerze> }

Klient przy wejściu do pokoju:
  t0 = Date.now(); const { now } = await fetch('/api/time'); t1 = Date.now();
  offset = now + (t1 - t0) / 2 - t1;

Wszędzie w UI używaj serverNow() = Date.now() + offset.
Odświeżaj offset co 60 s.
```

### 3.7 Obecność, rozłączenia, powroty

- Klient co **5 s** strzela `POST /api/rooms/[code]/ping` → serwer aktualizuje `lastSeenAt`.
- `lastSeenAt` starszy niż **20 s** → `connected: false`, awatar szary, ale gracz **nadal jest w grze**.
- Gra się nie może zablokować przez rozłączonego gracza. Każda faza wymagająca akcji ma timeout; po timeoucie akcja rozłączonego = domyślna (brak głosu / brak odpowiedzi / pas).
- **Odświeżenie strony ≠ wypadnięcie z gry.** Firebase Anonymous Auth persystuje uid w IndexedDB. Po refreshu wracasz na swoje miejsce, ze swoją rolą. **To musi działać. Przetestuj to.**
- Host wychodzi → automatyczna migracja hosta na kolejnego gracza z `seatOrder`.
- Host może wyrzucić gracza z lobby.
- Pokój wygasa po 8 h (`expiresAt`). Sprzątanie: Vercel Cron raz na dobę.

### 3.8 Koszty i wydajność Firestore — nie przepal darmowego limitu

Każdy zapis do dokumentu pokoju = N odczytów (N = liczba graczy z `onSnapshot`). Przy 12 osobach jeden zapis to 12 odczytów.

- **Nie zapisuj timerów.** Odliczanie liczy się z `phaseEndsAt` lokalnie.
- **Nie zapisuj drafta przy każdym wciśnięciu klawisza** w Państwach-miastach. Draft trzymaj w React state + `localStorage`. Do serwera leci raz — przy STOP lub przy końcu fazy.
- **Nie rób `onSnapshot` na całej kolekcji `events`** — tylko `orderBy('at','desc').limit(50)`.
- Realny budżet partii: ~200–400 zapisów. Darmowy limit Firestore (20k zapisów, 50k odczytów dziennie) starcza na cały wieczór z zapasem.

### 3.9 Wspólny ekran (opcjonalny)

Trasa `/pokoj/[kod]/ekran` — do otwarcia na laptopie podpiętym pod telewizor.

- Pokazuje: wielki kod pokoju + QR, listę graczy, tablicę wyników, dramaturgię (noc w Mafii, odsłanianie odpowiedzi, sylwetka wisielca, kolejność mówienia w Impostorze).
- **Nie jest wymagany.** Każdą grę musi dać się rozegrać wyłącznie na telefonach. Jeśli ekranu nie ma, jego treść ląduje na telefonach (mniejsza, kompaktowa).
- Nie liczy się jako gracz, nie ma uid w `players`, ale musi się uwierzytelnić anonimowo żeby przejść reguły — wpuść go jako „obserwatora": osobna trasa czytająca pokój przez API (Admin SDK), bo reguły wymagają bycia w `players`.
- Zasada podziału: **HostView = „co widzą wszyscy". PlayerView = „co widzę ja + moje przyciski".**

---

## 4. Wejście do gry

- **Kod pokoju:** 4 znaki z alfabetu `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (bez `I`, `O`, `0`, `1` — mylą się przy dyktowaniu). Kolizja → losuj ponownie.
- **Ekran startowy:** dwa przyciski. „Zakładam pokój" / „Dołączam". Nic więcej. Zero marketingu, zero landing page'a.
- **Dołączanie:** pole na kod (4 duże kratki, auto-advance, wklejanie działa) + nick (max 16 znaków) + wybór emoji-awatara z siatki ~30 emoji.
- **Deep link:** `/p/K7QM` → od razu ekran nicku, kod wypełniony.
- **QR:** w lobby i na ekranie hosta. Znajomi skanują zamiast wpisywać. To realnie skraca rozkręcenie gry z 2 minut do 20 sekund.
- **Lobby:** lista graczy (na żywo, z animacją wejścia + dźwiękiem), wybór gry (tylko host), panel ustawień gry (tylko host, reszta widzi podgląd), przycisk „Zaczynamy" (aktywny gdy `players >= minPlayers`).
- Duplikat nicka → dopisz `(2)`.
- Sanityzacja nicka: trim, bez znaków nowej linii, bez pustego, max 16 znaków.

---

## 5. Gry — specyfikacja

### 5.1 Kółko i krzyżyk

Buduj to **jako pierwsze**. Nie dlatego, że jest ważne — dlatego, że jest banalne, więc jeśli nie zmieści się w interfejsie `GameEngine`, to znaczy, że interfejs jest zły i trzeba go poprawić **zanim** napiszesz pięć skomplikowanych gier.

- 2 graczy z pokoju. Jeśli w pokoju jest więcej osób: kolejka „wygrany zostaje przy stole", reszta ogląda.
- Plansza 3×3, tury, wykrywanie wygranej i remisu, przycisk „Rewanż".
- **Zero wyjątków w rdzeniu.** Ta gra musi przejść przez dokładnie ten sam pipeline co Mafia.

### 5.2 Stoper

Dwa tryby. Referencja: `play.gameonfamily.com/timer-game/` — ale tam jest pass-and-play na jednym urządzeniu, a u nas każdy gra na swoim.

**Tryb A — CEL**

1. Wszyscy widzą **ten sam** cel, np. `7,43 s`. Cel losowany z zakresu (host wybiera max: 10 / 30 / 60 / 120 s) albo stały (np. dokładnie `10,00 s` — klasyk z TikToka).
2. Runda startuje jednocześnie. Każdy u siebie: wielki przycisk **START** → cyfry są **zamaskowane** (`●●:●●.●●`) → przycisk **STOP**.
3. Wynik = `|zmierzony − cel|`. Wyniki **ukryte** do momentu, aż wszyscy klikną STOP (albo minie limit = 3× cel).
4. Wielkie odsłonięcie: ranking wg błędu, ze znakiem (`+0,31 s ZA PÓŹNO` / `−0,08 s ZA WCZEŚNIE`).

**Tryb B — ZGADNIJ CZAS**

1. Jeden gracz to **Biegacz** (rotacja co rundę wg `seatOrder`).
2. Biegacz klika START, potem STOP kiedy chce. **Nikt nie widzi cyfr — biegacz też nie.**
3. START i STOP są rozgłaszane w czasie rzeczywistym: wszystkim telefonom leci **beep** (start) i **klik** (stop). To jest cała zabawa — reszta szacuje ze słuchu.
4. Każdy (biegacz też) wpisuje ile sekund trwało: stepper `+/−` z krokiem 0,1 + pole liczbowe z dokładnością 0,01.
5. Odsłonięcie: rzeczywisty czas + ranking wg błędu.

**Wspólne:**

- Rundy: 3 / 5 / 7 / bez limitu.
- Punktacja (host wybiera):
  - „Zwycięstwa" — najbliższy dostaje +1 pkt.
  - „Precyzja" — 1. miejsce 10 pkt, 2. — 7, 3. — 5, reszta 3, ostatni 1.
- **Idealne trafienie** (błąd < 0,05 s) → złote konfetti, osobny dźwięk, wpis do „rekordów pokoju".
- Tryb treningowy solo bez pokoju: `/gry/stoper/trening`.

**Uwagi implementacyjne — to jest gra o precyzji, więc:**

- **Nigdy nie mierz czasu przez `setInterval`.** Zapisz `t0 = performance.now()` przy starcie, `t1 = performance.now()` przy stopie, wynik = `t1 - t0`. `requestAnimationFrame` służy wyłącznie do animacji, nigdy do pomiaru.
- Pomiar jest lokalny (bo latencja sieci by go zabiła). Do serwera leci gotowy wynik po STOP.
- Sanity check na serwerze: odrzuć wyniki `< 50 ms` i `> 3× cel`. Porównaj też z czasem serwerowym START/STOP — jeśli różnica > 500 ms na korzyść gracza, oznacz wynik jako podejrzany (ikonka ⚠ przy wyniku, bez blokowania — to domówka, nie e-sport).
- `document.visibilitychange` w trakcie pomiaru → próba unieważniona („Nie zmieniaj karty 😉").
- Dźwięki przez **WebAudio API**, nie `<audio>` (za duże opóźnienie). AudioContext odblokowuje się po pierwszym tapnięciu użytkownika — zrób to w lobby.
- `navigator.vibrate(30)` przy STOP. **Uwaga: iOS Safari tego nie wspiera.** Nie polegaj na wibracji jako jedynym feedbacku.

### 5.3 Państwa-miasta

**Ustawienia (host):**

- **Kategorie.** Gotowe zestawy do wyboru + własne kategorie dopisywane w lobby. Zestawy do napisania:
  - *Klasyk*: Państwo, Miasto, Imię, Zwierzę, Roślina, Rzecz
  - *Rozszerzony*: + Zawód, Marka, Potrawa, Film lub serial
  - *Popkultura*: Film, Serial, Zespół muzyczny, Postać z gry, Youtuber/streamer, Piosenka
  - *Wiedza*: Rzeka, Góra lub pasmo, Stolica, Pierwiastek, Postać historyczna, Wynalazek
  - *Motoryzacja*: Marka auta, Model auta, Część samochodowa, Kierowca, Tor wyścigowy
  - *Impreza*: Alkohol, Przekąska, Powiedzonko, Coś w tym pokoju, Kiepska wymówka, Rzecz, której się wstydzisz
- Własne zestawy zapisywane w `localStorage` hosta („Moje zestawy") — żeby nie klikać tego samego co tydzień.
- **Litery.** Losowane bez powtórzeń w ramach gry. Konfigurowalna pula: domyślnie polski alfabet bez `Q`, `V`, `X`, `Y` oraz bez liter z ogonkami. Checkbox „tryb hardcore" dodaje `Ą Ć Ę Ł Ń Ó Ś Ź Ż`.
- **Koniec rundy** (trzy tryby):
  - **STOP przez pierwszego** — kto pierwszy wypełni wszystkie pola, klika STOP; reszta ma **10 s** (konfigurowalne) na dokończenie.
  - **Na czas** — sztywny timer 60 / 90 / 120 / 180 s.
  - **Ręcznie** — host zamyka rundę przyciskiem.
- Liczba rund: 3 / 5 / 8 / bez limitu.

**Przebieg rundy:**

1. **LOSOWANIE LITERY.** Pełnoekranowa animacja — bęben/ruletka przewijająca litery, zwalniająca, zatrzymująca się. Odliczanie 3-2-1, potem wielka litera. Na telefonach i ekranie hosta jednocześnie.
2. **PISANIE.** Formularz — jedno pole na kategorię. Licznik „4/6 wypełnione". Kropki na górze pokazują, ilu graczy już skończyło (bez nicków — nie chcemy presji imiennej... a właściwie chcemy, więc pokaż nicki, to podkręca tempo).
   - Pola: `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="words"`, `spellcheck="false"` — inaczej telefon będzie podpowiadał odpowiedzi.
   - Draft w `localStorage` (odporność na przypadkowe odświeżenie).
   - Przycisk **STOP!** aktywny dopiero gdy wszystkie pola wypełnione (w trybie „STOP przez pierwszego").
   - Serwer przyjmuje odpowiedzi do `phaseEndsAt + 5 s` (grace window na lag sieci), potem twardo odrzuca.
3. **WERYFIKACJA — głosowanie.** To jest dusza tej gry, zrób to dobrze.
   - Automat najpierw: puste = 0 pkt, zła pierwsza litera = 0 pkt (`Ł` to `Ł`, nie `L`).
   - Potem **kategoria po kategorii**: wszystkie odpowiedzi wszystkich graczy na ekranie (telefony + ekran hosta).
   - Przy każdej **cudzej** odpowiedzi przycisk 🚩 **„Kwestionuję"**.
   - Zakwestionowanie → autor dostaje **15 s** na krótkie uzasadnienie (opcjonalne pole tekstowe) → wszyscy **oprócz autora** głosują `UZNAJĘ / ODRZUCAM`.
   - **Większość decyduje. Remis = odpowiedź uznana** (wątpliwości na korzyść oskarżonego).
   - Host ma przycisk „Dalej" — nie blokujemy się w nieskończoność.
4. **PUNKTACJA** (domyślna, konfigurowalna przez hosta):
   - **15 pkt** — jedyny, który podał cokolwiek uznanego w tej kategorii
   - **10 pkt** — poprawna i unikalna
   - **5 pkt** — poprawna, ale ktoś podał to samo
   - **0 pkt** — brak / zła litera / odrzucona w głosowaniu
   - Porównanie duplikatów: normalizuj agresywnie — lowercase, usuń diakrytyki, zbij spacje. `Łódź`, `lodz` i `Lodz ` to ta sama odpowiedź.
5. **TABELA WYNIKÓW** — animowana, z deltami (`+35`). Po ostatniej rundzie: podium + konfetti.

### 5.4 Wisielec

**Trzy tryby, wszystkie do wyboru w lobby:**

**Tryb 1 — ZADAJĄCY (klasyk)**
- Jeden gracz (rotacja co rundę) wpisuje hasło + kategorię/podpowiedź. On nie zgaduje.
- Pozostali zgadują litery **na zmianę**, wg `seatOrder`. Timer 20 s na turę; brak akcji = pas.
- Trafiona litera → gracz zgaduje dalej (opcja: „trafienie = kolejna tura" ON/OFF).
- Pudło → +1 element wisielca, tura przechodzi dalej.
- W swojej turze można spróbować odgadnąć **całe hasło**. Pudło = **2 elementy** wisielca.
- Punkty: trafiona litera +1, odgadnięte hasło +5. Zadający +3, jeśli nikt nie odgadł.

**Tryb 2 — WYŚCIG**
- Wszyscy dostają **to samo** hasło z wybranego zestawu. Każdy gra u siebie, równolegle, własne życia.
- Na ekranie hosta (i w pasku na telefonach): **paski postępu wszystkich graczy w czasie rzeczywistym** — procent odkrytego hasła i liczba błędów, ale **bez pokazywania które litery**. Napięcie jest w tym, że widzisz, jak ktoś ci ucieka.
- Wygrywa: kto pierwszy odgadnie. Tie-break: mniej błędów.

**Tryb 3 — KOOPERACJA**
- Wspólne hasło, **wspólne życia** (domyślnie 10). Gracze na zmianę podają litery, timer 15 s na turę.
- Wygrywamy razem albo przegrywamy razem. Dobre na rozgrzewkę.

**Wspólne:**

- **Polska klawiatura ekranowa** — obowiązkowo własna, nie systemowa:
  `A Ą B C Ć D E Ę F G H I J K L Ł M N Ń O Ó P R S Ś T U W Y Z Ź Ż`
  (`Q`, `V`, `X` tylko gdy host włączy). Litery użyte: zielone = trafione, czerwone = pudło, wyszarzone = zablokowane. Duże przyciski, 6 kolumn na telefonie, do kciuka.
- **Czy `a` trafia w `ą`?** Domyślnie **nie** — to osobne litery. Opcja w ustawieniach: „ignoruj ogonki" (wtedy `a` odkrywa też `ą`).
- Hasła wieloczłonowe dozwolone (spacje pokazane jako wyraźne przerwy między grupami kresek).
- **Grafika wisielca — animowane SVG**, rysowane kreska po kresce (`stroke-dashoffset`). 10 etapów: 4× szubienica, głowa, tułów, 2× ręce, 2× nogi. Konfigurowalna liczba żyć: 6 / 8 / 10. Na ekranie hosta duży, na telefonie kompaktowy.
- Podpowiedź: kategoria zawsze widoczna. Opcjonalny przycisk „Odkryj losową literę" za karę (−2 pkt lub +1 element wisielca — host wybiera).

**Zestawy haseł do napisania (min. 60 haseł każdy):**
Zwierzęta · Jedzenie · Filmy i seriale · Polskie miasta · Marki · Sport · Powiedzenia i przysłowia · Motoryzacja · Zawody · Rzeczy w domu · Trudne

### 5.5 Impostor

Zasady bazowe: `psycatgames.com/pl/magazine/party-games/how-to-play-impostor/`. Wszyscy dostają to samo tajne słowo — oprócz impostora. Każdy mówi po jednym słowie kojarzącym się z hasłem. Potem dyskusja i głosowanie.

**Ustawienia (host):**

- Gracze: 3–16 (optimum 5–8).
- **Liczba impostorów:** 1–3. Auto-sugestia: ≤6 graczy → 1; 7–10 → 1–2; 11+ → 2–3.
- **Czy impostorzy się znają** (przy 2+): tak / nie.
- **Podpowiedź dla impostora** — pięć wariantów, to jest kluczowa oś konfiguracji:
  1. `BRAK` — impostor nie dostaje nic. Czysty hardcore.
  2. `KATEGORIA` — impostor zna tylko kategorię („Miejsce").
  3. `PIERWSZA LITERA` — impostor zna pierwszą literę hasła.
  4. `PODPOWIEDŹ OPISOWA` — krótka wskazówka przypisana ręcznie do hasła.
  5. `SŁOWO POWIĄZANE` — impostor dostaje **inne, ale bliskie** słowo z tej samej kategorii. Wszyscy mają „Plaża", on ma „Basen".
- **Czy impostor wie, że jest impostorem?** `TAK` (klasyk) / `NIE`. Wariant `NIE` działa tylko z podpowiedzią `SŁOWO POWIĄZANE`: impostor dostaje inne słowo i **nie ma pojęcia, że jest impostorem** — musi się sam zorientować, słuchając, że coś nie gra. To najlepszy tryb tej gry. Zaimplementuj oba.
- **Runda podpowiedzi:** liczba tur (1 / 2 / 3). Kolejność mówienia losowa, ale **jawna** — wszyscy widzą „Teraz: Damian → następny: Martyna". Opcja „impostor nigdy nie zaczyna" (bo pierwszy mówiący ma najtrudniej).
  - Tryb `NA GŁOS` (domyślny) — aplikacja pilnuje kolejki i czasu (15 s na słowo), słowa padają w pokoju.
  - Tryb `TEKSTOWY` — każdy wpisuje słowo, wszystkie odsłaniane jednocześnie. Zostaje ślad, można wrócić i porównać.
- **Dyskusja:** 60 / 90 / 120 s / bez limitu.
- **Głosowanie:** wszyscy na jednego podejrzanego, nie można na siebie. Remis → dogrywka 30 s → nadal remis → nikt nie wylatuje.
- **Po wylocie impostora:** dostaje **30 s na odgadnięcie hasła** (opcja, domyślnie ON). Trafi → wygrywa mimo wszystko (opcja: „remis" zamiast „impostor wygrywa"). Dopasowanie hasła: fuzzy — ignoruj wielkość liter, diakrytyki i końcówkę fleksyjną (`plaża` = `plaza` = `plaze`).
- **Impostor może zgadnąć w dowolnym momencie** (opcja): przycisk „ZGADUJĘ HASŁO" na jego ekranie. Pudło = natychmiastowa przegrana.
- **Punktacja przez rundy:** cywile +1 za wykrycie impostora; impostor +2 za przetrwanie, +3 za odgadnięcie hasła. Konfigurowalne.
- **Sprawiedliwa rotacja** (opcja): kto był impostorem, nie zostanie nim ponownie, dopóki wszyscy nie byli.

**Ekran hasła:** pełnoekranowa karta, **„Przytrzymaj palec, żeby zobaczyć"** (press-and-hold to reveal). Puścisz — hasło znika. Chroni przed zerkaniem sąsiada, ładnie wygląda i wymusza ten moment napięcia.

**Zestawy słów do napisania (min. 40 haseł każdy, po polsku, ręcznie):**
Jedzenie · Miejsca · Zwierzęta · Zawody · Filmy i seriale · Przedmioty codzienne · Sport · Muzyka · Technologia · Polska · Motoryzacja · Impreza

**Struktura hasła — każde potrzebuje kompletu danych:**

```typescript
{
  slowo: 'Plaża',
  kategoria: 'Miejsce',
  podpowiedz: 'Latem tłoczno, zimą pusto',
  powiazane: ['Basen', 'Jezioro', 'Sauna', 'Molo'],  // do trybu SŁOWO POWIĄZANE
}
```

**Jakość haseł to połowa jakości tej gry.** Napisz je sam, ręcznie, dobierając `powiazane` tak, żeby były naprawdę mylące (bliskie, ale nie identyczne). Nie generuj list programowo. Dobre hasło jest powszechne i łatwe do zasugerowania, ale trudne do jednoznacznego określenia.

### 5.6 Mafia

Zasady i pełna lista ról: `dzieciakizpotencjalem.pl/2026/02/mafia-zasady-i-role/`. Poniżej to, co ma być zaimplementowane.

**Konfiguracja w lobby:**

- Gracze: 6–16 (poniżej 6 pokaż ostrzeżenie, ale pozwól).
- **Auto-balans mafii:** 6–7 → 2 · 8–10 → 3 · 11–13 → 4 · 14–16 → 5. Host może nadpisać.
- **Tryb prowadzenia — dwa, do wyboru:**
  - **AUTO-NARRATOR** — aplikacja prowadzi grę. Wszyscy grają. Noc odbywa się na telefonach.
  - **Z PROWADZĄCYM** — jedna osoba (`narratorUid`) nie gra. Dostaje panel: pełna lista graczy z rolami, sekwencja „kto się teraz budzi", przyciski zatwierdzania akcji, ręczne sterowanie fazami, cofnięcie ostatniej akcji, timer dyskusji. Gracze i tak wykonują akcje na telefonach (albo narrator wprowadza je za nich — obie opcje w panelu).
- **Role.** Checkboxy z licznikami. Przy każdej krótki opis widoczny w UI.
  - Podstawowe: **Mafiozi** (n), **Mieszkańcy** (reszta), **Detektyw**, **Lekarz**
  - Dodatkowe: **Mściciel**, **Barman**, **Czarodziej**, **Cwaniak**, **Adwokat**, **Jasnowidz**, **Kamikadze**, **Snajper**, **Seryjny morderca**, **Medium**, **Amor**, **Magik**, **Podwójny agent**, **Zakochana para**, **Dziennikarz**, **Szeryf**
  - Walidacja: `suma ról specjalnych ≤ liczba graczy − liczba mafiozów`. Ostrzeżenia o balansie (np. „Seryjny morderca przy 6 graczach zrobi rzeź").
- **Opcje:** ujawniać rolę po śmierci (tak/nie) · czas dyskusji (2/3/5 min/bez limitu) · czas głosowania (60 s) · zmarli widzą wszystko (tak/nie) · „ostatnie słowo" umierającego (30 s, tak/nie) · lekarz może ratować siebie (tak/nie/raz) · lekarz nie może ratować tej samej osoby 2× z rzędu (tak/nie) · głosowanie jawne czy tajne.

**Przebieg (auto-narrator):**

**1. ROZDANIE.** Każdy widzi na telefonie kartę roli — animacja odwracania karty, opis zdolności. Mafiozi widzą się nawzajem („Twoja mafia: Damian, Konrad"). Zakochana para / Amor / Podwójny agent — odpowiednie ujawnienia. Przycisk „Zapamiętałem". Gra rusza, gdy wszyscy potwierdzą.

**2. NOC — kolejność budzenia. Zaimplementuj jako stałą `WAKE_ORDER`, w tej kolejności:**

| # | Rola | Kiedy | Akcja |
|---|---|---|---|
| 1 | Jasnowidz | noc 1 | poznaje wszystkie karty, nie może się ujawnić |
| 2 | Amor | noc 1 | wskazuje parę zakochanych |
| 3 | Zakochana para | noc 1 | poznają się nawzajem |
| 4 | Barman | każda | „upija" osobę — jeśli to mafioso, zabójstwo mafii idzie na sąsiada z lewej |
| 5 | Szeryf | raz w grze | blokuje zdolność jednej osoby na tę noc |
| 6 | Magik | każda | wskazana osoba „znika" — na dzień nie mówi i nie głosuje |
| 7 | **Mafia** | każda | **wspólny ekran wyboru** — mafiozi widzą swoje głosy na żywo; decyduje większość, remis → głos pierwszego z listy |
| 8 | Podwójny agent | każda | widzi wybór mafii, ale nie głosuje; mafia o nim nie wie |
| 9 | Seryjny morderca | każda | wybiera dodatkową ofiarę |
| 10 | Snajper | każda | strzela lub się wstrzymuje |
| 11 | Lekarz | każda | ratuje jedną osobę |
| 12 | Detektyw | każda | sprawdza jedną osobę → odpowiedź TAK/NIE |
| 13 | Dziennikarz | raz w grze | dostaje wskazanie jednego mafioza |
| 14 | Medium | raz w grze | poznaje tożsamość jednego zmarłego |
| 15 | Czarodziej | raz w grze | zamienia role dwóch osób |

UI nocy: każdy gracz widzi „Miasto śpi…" z animacją. Gracz z aktywną rolą dostaje swój ekran akcji + timer 30 s. Nie zdążył → pomija. Ekran hosta: klimatyczna animacja + „Budzi się: Mafia…" (bez zdradzania kto).

**3. ROZLICZENIE NOCY.** Kolejność stosowania efektów — tu najłatwiej o bugi, **napisz na to testy jednostkowe:**
   1. Szeryf blokuje zdolność → zablokowana akcja nie działa wcale
   2. Barman przekierowuje zabójstwo mafii (jeśli upił mafioza)
   3. Zabójstwa: mafia + seryjny morderca + snajper
   4. Snajper: trafił mafioza → mafioso ginie. Trafił mieszkańca → **giną obaj**.
   5. Lekarz anuluje jedno zabójstwo (to na osobie, którą chronił)
   6. Magik: cel wyciszony na dzień
   7. Czarodziej: podmiana ról (obowiązuje od następnej nocy)

**4. ŚWIT.** Ekran hosta ogłasza wyniki z **pauzą dramatyczną 3 s** przed każdym nazwiskiem. Ujawnienie roli wg ustawienia. Reakcje łańcuchowe:
   - **Mściciel** ginie → 20 s na wskazanie kogoś, kto ginie z nim
   - **Kamikadze** ginie → sąsiad (strona ustalona przed grą) ginie
   - **Zakochana para** — jedno ginie → drugie ginie i ujawnia rolę

**5. DZIEŃ / DYSKUSJA.** Timer. Na telefonach: lista żywych + przycisk „Oskarżam" (nominacja, wymaga poparcia jednej osoby — opcja).
   - **Bez czatu tekstowego.** Siedzicie w jednym pokoju, rozmawiacie na żywo. Czat byłby absurdem.
   - Zamiast tego: przycisk „✋ Ręka" i szybkie reakcje emoji, które lecą na ekran hosta. Śmieszne i praktyczne — narrator widzi, kto chce mówić.

**6. GŁOSOWANIE.** Wszyscy żywi głosują na jednego z nominowanych albo „nikt". Jawnie lub tajnie (ustawienie). Głosy widoczne na ekranie hosta.
   - Remis → dogrywka 60 s → nadal remis → nikt nie ginie.
   - **Cwaniak** przegłosowany → może się ujawnić i zamiast siebie usunąć dowolną osobę.
   - **Adwokat** → raz w grze może uratować przegłosowanego.

**7. OSTATNIE SŁOWO** (opcja): 30 s dla eliminowanego. Potem odsłonięcie roli (jeśli włączone).

**8. WARUNKI ZWYCIĘSTWA — sprawdzane po KAŻDEJ śmierci, nie tylko na koniec fazy:**
   - **Miasto wygrywa:** 0 żywych mafiozów (i 0 seryjnych morderców, jeśli w grze).
   - **Mafia wygrywa:** `liczba mafiozów ≥ liczba pozostałych żywych`.
   - **Seryjny morderca:** wygrywa sam, gdy zostaje jako ostatni żywy lub w układzie 1 na 1.
   - **Zakochana para** (opcja): jeśli zostaną tylko oni dwoje — wygrywają razem, niezależnie od frakcji.

**9. KONIEC.** Ekran z pełnym rozdaniem ról, statystyki (kto kogo zabił, kto jak głosował, kto przetrwał najdłużej), przycisk **„Jeszcze raz, ten sam skład"**.

**Skrypt narratora.** Napisz po ~8 klimatycznych, losowanych kwestii na każdą fazę (noc, świt, dyskusja, głosowanie, śmierć). Wyświetlaj na ekranie hosta (auto-narrator) albo do przeczytania na głos (tryb z prowadzącym). W stylu: *„Miasto pogrąża się w ciszy… ktoś skrada się uliczkami…"*. To brzmi jak drobiazg, a robi 80% klimatu tej gry.

**Bezpieczeństwo:** role rozdaje **wyłącznie Route Handler** przez Admin SDK. Trafiają do `rooms/{code}/private/{uid}` i `rooms/{code}/secret/state`. Do `publicState` **nigdy**. Napisz test, który to sprawdza: uruchom pełne rozdanie, zserializuj `publicView()`, i sprawdź, że nie ma w nim żadnego stringa z nazwą roli mafijnej ani żadnego uid mafiozów.

---

## 6. Design

### 6.1 Koncept

**Strona to szafa arcade. Telefony to pady.**

Ta metafora spina całość i to z niej wynikają wszystkie decyzje: wspólny ekran udaje stary telewizor (scanline, poświata, chromatyczna aberracja), telefony są czystym, funkcjonalnym kontrolerem z wielkimi przyciskami. Nie mieszaj tego — efekty CRT **tylko** na ekranie hosta.

Klimat: polska domówka o pierwszej w nocy, nie sterylny cyberpunkowy dashboard.

### 6.2 Tokeny

**Kolory** (do `@theme` w Tailwind v4):

```css
--color-tlo:        #0B0A12;  /* prawie czerń z fioletowym podkładem */
--color-powierzchnia: #141122;  /* karty */
--color-uniesione:  #1E1A30;  /* modale, aktywne */
--color-obramowanie:#3A3453;
--color-tekst:      #F5F3FF;
--color-tekst-drugi:#A5A0BD;

/* akcenty — każda gra ma swój, patrz tabela w §1 */
--color-cyjan:      #22D3EE;
--color-limonka:    #CCFF00;
--color-bursztyn:   #FFB627;
--color-czerwien:   #E4002B;
--color-magenta:    #FF2D95;
--color-stal:       #94A3B8;
```

Akcent gry przenika cały ekran tej gry — obramowania, poświatę przycisków, glow. Wchodzisz w Mafię, robi się czerwono. To ma być czuć.

**Typografia** — i tu **uwaga krytyczna**:

> **Font MUSI mieć polskie znaki (`latin-ext`): Ą Ć Ę Ł Ń Ó Ś Ź Ż.** Większość „arcade'owych" fontów ich nie ma — **Press Start 2P, Orbitron i VT323 odpadają.** Sprawdź każdy font, zanim go użyjesz. Jeśli w interfejsie zobaczę „Łódź" wyrenderowane jako „ódź", wracamy do tego punktu.

- **Display** (nagłówki, kod pokoju, nazwy gier): **Chakra Petch** — techniczny, lekko ukośny, ma `latin-ext`.
- **Body:** **Inter** — czytelny w półmroku, ma `latin-ext`.
- **Liczby i dane** (stoper, wyniki, timery, kod pokoju): **JetBrains Mono** z `font-variant-numeric: tabular-nums`. Cyfry nie mogą skakać przy zmianie.

Cyfry stopera: ogromne, monospace, tabular. To jest bohater tego ekranu.

### 6.3 Element sygnaturowy

**Kod pokoju jako neonowy szyld.** Cztery znaki, każdy w osobnej „rurce" neonu, z flickerem przy pojawieniu się. Wielki na ekranie hosta i przy dołączaniu, w miniaturze w rogu każdego ekranu przez całą grę. To jest to, co ludzie zapamiętają i po czym rozpoznają stronę.

Wydaj całą śmiałość tutaj. Reszta interfejsu ma być cicha i zdyscyplinowana.

### 6.4 Ruch i dźwięk

- **Framer Motion.** Momenty do zaorkiestrowania: losowanie litery (ruletka), odsłanianie roli (flip karty), zapadanie nocy w Mafii (przyciemnienie + winieta), odsłanianie wyników (kaskada), konfetti na zwycięstwo.
- **Nie dekoruj wszystkiego.** Rozproszone animacje na każdym przycisku = wygląda jak wygenerowane przez AI. Jeden mocny moment na fazę.
- Szanuj `prefers-reduced-motion`.
- **Dźwięk:** krótkie SFX przez WebAudio (beep, klik, fanfara, „dun dun" przy śmierci w Mafii). Przełącznik wyciszenia zawsze widoczny. AudioContext odblokuj pierwszym tapnięciem w lobby.

### 6.5 Higiena mobilna — checklista, odhacz każdy punkt

- [ ] `100dvh`, nie `100vh` (iOS Safari inaczej ucina interfejs paskiem adresu)
- [ ] `env(safe-area-inset-*)` — notch i pasek gestów na iPhonie
- [ ] `overscroll-behavior: none` — żeby pull-to-refresh nie wywalił gry w połowie rundy
- [ ] `touch-action: manipulation` — zero opóźnienia 300 ms i zero zoomu przy dwukliku
- [ ] `user-scalable=no` w viewport
- [ ] Przyciski min. **56 px** wysokości
- [ ] **Wake Lock API** — ekran nie może gasnąć w trakcie gry. iOS Safari < 16.4 nie wspiera → fallback: pokaż komunikat „Ustaw wygaszanie ekranu na dłużej"
- [ ] Widoczny focus klawiaturowy (dla desktopu / ekranu hosta)
- [ ] Nie polegaj wyłącznie na kolorze — mafia/miasto mają też ikony

---

## 7. Deploy i zmienne

**Firebase (jednorazowo):**
1. Utwórz projekt → Firestore w trybie produkcyjnym (region `europe-central2`, Warszawa)
2. Authentication → włącz **Anonymous**
3. Project settings → Service accounts → wygeneruj klucz JSON
4. `firebase deploy --only firestore:rules,firestore:indexes`

**Zmienne środowiskowe** (`.env.local` + Vercel):

```
# publiczne, klient
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# TYLKO SERWER — nigdy z prefiksem NEXT_PUBLIC_
FIREBASE_SERVICE_ACCOUNT_KEY=   # cały JSON zakodowany base64, w jednej linii
```

**Vercel:** import repo z GitHuba → wklej zmienne → deploy. Framework wykryje się sam.

**PWA:** `manifest.json` + prosty service worker, ikony, `theme-color: #0B0A12`. Ma się dać dodać do ekranu głównego i odpalać w trybie fullscreen. Nie kombinuj z offline-first — gra i tak wymaga sieci.

---

## 8. Pułapki, na które na pewno wpadniesz, jeśli tego nie przeczytasz

1. **`firebase-admin` nie działa na Edge Runtime.** W każdym Route Handlerze: `export const runtime = 'nodejs'`.
2. **`firebase-admin` nie może się inicjalizować przy każdym requeście** (serverless). Singleton z guardem na `getApps().length`.
3. **Firebase client SDK tylko w Client Components** (`'use client'`), inicjalizacja jako singleton odporny na HMR.
4. **`players` jako mapa, nie tablica.** Tablice w Firestore nie dają się bezpiecznie aktualizować równolegle i nie da się na nich pisać reguł per-element.
5. **Zegary telefonów są rozjechane.** Bez korekty offsetu (§3.6) timery będą się rozjeżdżać między graczami o kilkanaście sekund. To zabije Stoper i Państwa-miasta.
6. **iOS Safari nie wspiera `navigator.vibrate`.** Wibracja to bonus, nie feedback podstawowy.
7. **AudioContext na iOS wymaga gestu użytkownika.** Odblokuj przy pierwszym tapnięciu, nie przy `useEffect`.
8. **Kolejność tur musi być zapisana na serwerze** (`seatOrder`), losowana raz. Nie sortuj po uid, nie licz po kolejności w mapie.
9. **`onSnapshot` — obsłuż `hasPendingWrites`** i nie renderuj migotania przy własnych zapisach.
10. **Nick może zawierać emoji i znaki specjalne.** Sanityzuj, ale nie wywalaj się.
11. **Optimistic lock.** Każda akcja wysyła `version`. Serwer odrzuca (`409`), jeśli się nie zgadza. Klient po `409` po prostu czeka na świeży snapshot — bez retry, bez błędu w UI.

---

## 9. Plan pracy — fazy

**Po każdej fazie aplikacja musi być uruchamialna, `npm run build` musi przechodzić, testy muszą przechodzić. Commituj po każdej fazie.**

- **Faza 0 —** Setup: Next.js, Tailwind v4, Firebase (klient + admin), Anonymous Auth, `/api/time`, deploy „hello world" na Vercel. **Celem jest sprawdzenie, że cały pipeline działa, zanim napiszemy cokolwiek ciekawego.**
- **Faza 1 —** Rdzeń pokoju: zakładanie, dołączanie kodem, deep link, QR, lobby, presence, reconnect, migracja hosta, ekran hosta. **Bez żadnej gry.** To musi działać samo w sobie.
- **Faza 2 —** Silnik gier + rejestr + **Kółko i krzyżyk**. Jeśli abstrakcja nie udźwignie tak banalnej gry — popraw abstrakcję.
- **Faza 3 —** Stoper (oba tryby).
- **Faza 4 —** Państwa-miasta.
- **Faza 5 —** Wisielec (trzy tryby).
- **Faza 6 —** Impostor.
- **Faza 7 —** Mafia. Najpierw role podstawowe (mafia, mieszkańcy, detektyw, lekarz) i auto-narrator — do grywalności. Potem role dodatkowe. Potem tryb z prowadzącym.
- **Faza 8 —** Polish: dźwięki, animacje, konfetti, PWA, dopieszczenie ekranu hosta, ekran „Rekordy pokoju".

---

## 10. Definition of Done — będę to sprawdzał

- [ ] Odświeżenie strony w trakcie gry **nie wywala gracza** — wraca na swoje miejsce, ze swoją rolą.
- [ ] Otwarcie DevTools i przejrzenie **całego Firestore, do którego klient ma dostęp**, nie ujawnia, kto jest mafią/impostorem ani jakie jest tajne hasło.
- [ ] Rozłączenie gracza w trakcie nocy **nie blokuje gry** — po timeoucie faza idzie dalej.
- [ ] Timer u wszystkich graczy pokazuje **tę samą** wartość (±1 s), nawet gdy któryś telefon ma zegar rozjechany o minutę.
- [ ] Wszystkie polskie znaki renderują się poprawnie we wszystkich fontach.
- [ ] Działa na **iPhone Safari** i **Android Chrome**. Sprawdź oba.
- [ ] Ekran nie gaśnie w trakcie gry.
- [ ] Każda gra ma testy jednostkowe silnika: pełna partia od `init()` do `isFinished()`.
- [ ] Mafia ma osobne testy rozliczenia nocy: lekarz ratuje · barman przekierowuje · snajper pudłuje i ginie z ofiarą · szeryf blokuje.
- [ ] Dodanie nowej gry wymaga: **jednego nowego folderu + jednej linii w `registry.ts`**. Nic więcej. Zero zmian w rdzeniu.

---

## 11. Czego NIE robić

- ❌ Nie trzymaj stanu gry w `localStorage` (tylko preferencje i drafty).
- ❌ Nie rób czatu tekstowego. Gracze siedzą w jednym pokoju.
- ❌ Nie rób logowania, rejestracji, kont, e-maili.
- ❌ Nie rób landing page'a z marketingiem. Wejście = dwa przyciski.
- ❌ Nie generuj list haseł/kategorii programowo ani losowo. **Napisz je ręcznie.** Jakość haseł to połowa jakości gry.
- ❌ Nie używaj `setInterval` do pomiaru czasu w Stoperze.
- ❌ Nie dodawaj rate-limitera ani systemu ról/uprawnień. To domówka, nie SaaS. Obroną jest walidacja akcji, nie infrastruktura.
- ❌ Nie zmieniaj zasad gier „bo tak będzie lepiej". Jeśli coś w specu jest niejasne albo sprzeczne — **zapytaj mnie**, nie zgaduj.

---

## 12. Zanim zaczniesz kodować

1. Przeczytaj cały ten dokument.
2. Wypisz mi wszystko, co jest niejasne, sprzeczne albo czego brakuje. **Zadaj pytania.**
3. Przedstaw plan Fazy 0 i Fazy 1 — konkretne pliki, konkretna kolejność.
4. **Poczekaj na moje OK.** Nie zaczynaj kodować, dopóki nie potwierdzę.

---

## Załącznik A — treść `CLAUDE.md`

Zapisz to w katalogu głównym repo:

```markdown
# Domówka — pamięć projektu

## Co to jest
Multiplayerowe gry imprezowe w przeglądarce. Każdy gracz na swoim telefonie,
wspólny pokój z 4-znakowym kodem. Next.js 15 + Firebase + Vercel.

## Pełna specyfikacja
`SPEC.md` — czytaj ją zawsze przed większą zmianą. Po `/compact` przeczytaj ponownie
sekcje 3 (architektura) i sekcję gry, nad którą pracujesz.

## Zasady nienegocjowalne
1. Klient NIGDY nie zapisuje stanu gry. Wszystko przez Route Handlery + Admin SDK.
2. `engine.ts` każdej gry jest czystą funkcją: zero Date.now(), zero Math.random().
   Czas i losowość wchodzą przez ctx.
3. Role i tajne hasła nigdy nie trafiają do `publicState`.
4. Dodanie nowej gry = nowy folder w `src/games/` + linia w `registry.ts`. Zero zmian w rdzeniu.
5. Wszystko po polsku. Fonty muszą mieć latin-ext (Ą Ć Ę Ł Ń Ó Ś Ź Ż).
6. Mobile-first. Przyciski min. 56 px. `100dvh`, nie `100vh`.

## Komendy
npm run dev / build / test / lint
firebase deploy --only firestore:rules

## Aktualny stan
<!-- aktualizuj po każdej fazie -->
- [ ] Faza 0 — setup i deploy
- [ ] Faza 1 — pokoje i lobby
- [ ] Faza 2 — silnik + kółko i krzyżyk
- [ ] Faza 3 — Stoper
- [ ] Faza 4 — Państwa-miasta
- [ ] Faza 5 — Wisielec
- [ ] Faza 6 — Impostor
- [ ] Faza 7 — Mafia
- [ ] Faza 8 — polish
```

---

## Załącznik B — prompt startowy do wklejenia w Claude Code

```
Buduję stronę z grami imprezowymi na domówki. Pełna specyfikacja jest w SPEC.md
w tym repo — przeczytaj ją w całości, zanim cokolwiek napiszesz.

Zwróć szczególną uwagę na sekcję 3 (architektura) — kluczowe jest to, że klient
nigdy nie zapisuje stanu gry, bo inaczej każdy odczyta z DevToolsów, kto jest mafią.

Nie zaczynaj kodować od razu. Najpierw:
1. Wypisz wszystko, co w SPEC.md jest niejasne, sprzeczne albo czego brakuje.
2. Zadaj mi pytania.
3. Przedstaw plan Fazy 0 i Fazy 1 (konkretne pliki, konkretna kolejność).
4. Poczekaj na moje OK.
```
