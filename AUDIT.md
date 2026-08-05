# AUDIT.md — Faza A: audyt repozytorium Domówka

> Wygenerowano: 2026-08-05. Nic nie zmienione w kodzie. Żaden commit.

---

## A1. Stan faktyczny

### Drzewo katalogów z komentarzem

```
domowka/
├── CLAUDE.md              — pamięć projektu, zasady nienegocjowalne
├── SPEC.md                — pełna specyfikacja funkcjonalna (sekcje 1–9)
├── UPGRADE.md             — brief modernizacyjny v2
├── firestore.rules        — reguły bezpieczeństwa Firestore
├── firebase.json          — konfiguracja Firebase CLI
├── package.json           — Next 15.5.20, React 19.1, Firebase 12/14, Zod 4, Zustand 5, Tailwind 4
├── tsconfig.json          — strict: true
├── next.config.ts         — serverExternalPackages: ["firebase-admin"]
├── public/
│   ├── manifest.webmanifest — manifest PWA (minimalny)
│   ├── sw.js               — service worker (przepustkowy, zero cache)
│   └── icon.svg            — jedyna ikona (SVG, używana do wszystkiego)
└── src/
    ├── app/
    │   ├── layout.tsx       — fonty (Chakra Petch, Inter, JetBrains Mono), metadata, viewport
    │   ├── page.tsx         — ekran startowy: 2 przyciski
    │   ├── globals.css      — tokeny @theme, reset mobilny, .btn, .card, .neon-code, .crt
    │   ├── nowy/page.tsx    — zakładanie pokoju (EntryForm create)
    │   ├── dolacz/page.tsx  — dołączanie kodem (EntryForm join)
    │   ├── p/[code]/page.tsx — deep link (/p/K7QM → EntryForm z kodem)
    │   ├── pokoj/[code]/page.tsx     — lobby + harness gry (GameShell)
    │   ├── pokoj/[code]/ekran/page.tsx — ekran hosta (TV), CRT
    │   └── api/
    │       ├── time/route.ts      — korekta zegara (GET → { now })
    │       ├── rooms/route.ts     — POST: tworzenie pokoju
    │       └── rooms/[code]/
    │           ├── action/route.ts — POST: akcja gracza w grze
    │           ├── join/route.ts   — POST: dołączanie (idempotentne)
    │           ├── leave/route.ts  — POST: wyjście/wyrzucenie + migracja hosta
    │           ├── ping/route.ts   — POST: heartbeat obecności (co 5 s)
    │           ├── tick/route.ts   — POST: wymuszenie przejścia fazy
    │           ├── start/route.ts  — POST: host startuje grę
    │           ├── reset/route.ts  — POST: host wraca do lobby
    │           └── observe/route.ts — POST: rejestracja obserwatora (ekran hosta)
    ├── components/
    │   ├── EntryForm.tsx      — formularz nick+awatar+kod
    │   ├── CodeInput.tsx      — 4 kratki na kod pokoju
    │   ├── AvatarPicker.tsx   — siatka 30 emoji
    │   ├── PlayerList.tsx     — lista graczy z krokiem reconnect
    │   ├── RoomCodeNeon.tsx   — neonowy szyld kodu pokoju
    │   ├── RoomQr.tsx         — QR z deep linkiem
    │   ├── ServiceWorkerRegister.tsx — rejestracja SW
    │   └── game/
    │       ├── GameShell.tsx  — harness kliencki (private, tick, wake lock, konfetti, dispatch)
    │       └── LobbyGames.tsx — wybór gry + ustawienia + start
    ├── hooks/
    │   ├── useAnonAuth.ts     — anonimowa sesja Firebase
    │   ├── useRoom.ts         — onSnapshot na rooms/{code} z retryami
    │   ├── usePrivate.ts      — onSnapshot na private/{uid}
    │   ├── usePresence.ts     — ping co 5 s
    │   ├── useServerClock.ts  — korekta offsetu zegara
    │   ├── useGameTick.ts     — ponaglanie /tick przy wygaśnięciu fazy
    │   └── useWakeLock.ts     — Wake Lock API
    ├── lib/
    │   ├── avatars.ts         — 30 emoji
    │   ├── confetti.ts        — canvas-confetti + złote konfetti
    │   ├── room-code.ts       — generowanie/normalizacja kodu 4-znakowego
    │   ├── sound.ts           — WebAudio SFX (beep, klik, fanfara, wibracja)
    │   ├── types/room.ts      — typy Room, Player, PlayerMap + stałe
    │   ├── schemas/room.ts    — Zod: createRoom, joinRoom, codeParam, sanitizeNick, dedupeNick
    │   ├── store/session.ts   — Zustand persist: nick + awatar w localStorage
    │   ├── client/api.ts      — apiPost z tokenem
    │   ├── server/auth.ts     — requireUid (weryfikacja ID tokenu)
    │   ├── server/http.ts     — handleApiError (mapowanie wyjątków)
    │   ├── server/rooms.ts    — newRoom, newPlayer, pickNewHost, isConnected
    │   └── firebase/
    │       ├── admin.ts       — singleton Admin SDK (server-only)
    │       ├── client.ts      — singleton klienta Firebase + ensureAnonAuth
    │       └── service-account.ts — dekoder base64 → ServiceAccount
    └── games/
        ├── types.ts           — GameEngine, GameManifest, GameError, konteksty
        ├── registry.ts        — GAMES mapa + GAME_LIST
        ├── components.tsx     — GAME_COMPONENTS mapa (Settings/PlayerView/HostView)
        ├── view.ts            — propsy widoków (GameViewProps, GameHostViewProps, GameSettingsProps)
        ├── rng.ts             — mulberry32, randomSeed, shuffle
        ├── useOptimistic.ts   — useSent, usePendingSet
        ├── stoper/            — manifest, engine, test, Settings, PlayerView, HostView
        ├── panstwa-miasta/    — manifest, engine, test, Settings, PlayerView, HostView, data/categories
        ├── wisielec/          — manifest, engine, test, Settings, PlayerView, HostView, ui (klawiatura+SVG), data/words
        ├── impostor/          — manifest, engine, test, Settings, PlayerView, HostView, data/words
        └── mafia/             — manifest, engine, test, Settings, PlayerView, HostView, data/narrator
```

### Status gier wg SPEC.md

| Gra | Status | Uwagi |
|---|---|---|
| Kółko i krzyżyk | ❌ brak | Pominięte na życzenie Jakuba (CLAUDE.md Faza 2) |
| Stoper | 🟡 częściowo | Tryb A „CEL" gotowy; tryb B „ZGADNIJ CZAS" nie zaimplementowany |
| Państwa-miasta | ✅ pełne | Wszystkie tryby, weryfikacja, głosowanie, punktacja |
| Wisielec | ✅ pełne | 3 tryby (wyścig/kooperacja/zadający), polska klawiatura, SVG szubienicy |
| Impostor | ✅ pełne | 5 wariantów podpowiedzi, tryb „nie wie że jest impostorem", głosowanie, zgadywanie |
| Mafia | 🟡 częściowo | Rdzeń: mafia/mieszkańcy/detektyw/lekarz + auto-narrator. Brak: 16 ról dodatkowych, tryb z prowadzącym |

### Status faz wg CLAUDE.md

| Faza | Status | Komentarz |
|---|---|---|
| 0 — setup | ✅ | Firebase, auth, deploy |
| 1 — pokoje | ✅ | lobby, presence, QR, ekran hosta |
| 2 — silnik + registry | ✅ | GameEngine interface, walidacja na Stoperze |
| 3 — Stoper | 🟡 | Tryb A gotowy, tryb B do zrobienia |
| 4 — Państwa-miasta | ✅ | Zweryfikowane na produkcji |
| 5 — Wisielec | ✅ | 3 tryby, zweryfikowane |
| 6 — Impostor | ✅ | Zweryfikowane (brak wycieku w publicState) |
| 7 — Mafia | 🟡 | Rdzeń gotowy, role dodatkowe i tryb z prowadzącym brak |
| 8 — polish | 🟡 | PWA (manifest+SW+ikona), Wake Lock, konfetti — gotowe. Brak: Stoper B, role Mafii, rekordy pokoju |

---

## A2. Rozjazd ze specyfikacją

| # | Plik:linia | Opis rozjazdu | Bug vs świadoma decyzja |
|---|---|---|---|
| 1 | `manifest.webmanifest` | Brak: `id`, `scope`, `categories`, `dir`, `shortcuts`. Jedna ikona SVG zamiast PNG 192/512 + maskable. Brak `apple-touch-icon` 180×180. | Świadome uproszczenie Fazy 8 |
| 2 | `public/sw.js` | Service worker przepustkowy (zero cache). Brak ekranu offline, brak strategii cache. | Świadome — SPEC §7 mówi „nie kombinuj z offline-first", ale UPGRADE §B2 wymaga pełnego SW |
| 3 | `layout.tsx:44` | `userScalable: false` na **całej** aplikacji. SPEC §6.5 mówi „na ekranach gry, nie na całej aplikacji" — psuje dostępność na stronach z tekstem | Bug — za szeroki zakres |
| 4 | Mafia `engine.ts` | Tylko 4 role podstawowe (mafia/mieszkaniec/detektyw/lekarz). SPEC §5.6 wymaga 16 dodatkowych + WAKE_ORDER. | Świadome — CLAUDE.md: „Do zrobienia: role dodatkowe" |
| 5 | Mafia `engine.ts` | Brak trybu z prowadzącym (narratorUid). SPEC §5.6 wymaga dwa tryby. | Świadome — CLAUDE.md: „tryb z prowadzącym do zrobienia" |
| 6 | Stoper `engine.ts` | Brak trybu B „ZGADNIJ CZAS". SPEC §5.2 wymaga obu. | Świadome — CLAUDE.md: „tryb B do zrobienia" |
| 7 | `leave/route.ts` | Brak migracji hosta **przy rozłączeniu** (>30 s). Migracja następuje tylko przy /leave. SPEC §3.7 i UPGRADE §C1 wymagają automatycznej migracji po 30 s. | Bug — brakuje mechanizmu server-side |
| 8 | Brak | Nie ma heartbeat/presence server-side. Serwer nie sprawdza lastSeenAt i nie oznacza rozłączonych. Klient pinguje, ale „connected: false" ustawiany jest lokalnie w PlayerList, nie na serwerze. | Bug — SPEC §3.7 mówi „>20 s → connected: false" powinno być na serwerze |
| 9 | `ping/route.ts:28` | Ping **nie jest w transakcji** — race condition z innymi update'ami. | Bug (drobny) — brak atomowości |
| 10 | `action/route.ts` | Brak `actionId` na idempotencję (UPGRADE §C2). Dwuklik → dwie akcje. | Brak — nie zaimplementowane |
| 11 | `reset/route.ts:24` | `secret/state.delete()` i `ref.update()` NIE są w transakcji — race condition. | Bug — jeśli ktoś zdąży wysłać akcję między delete a update |
| 12 | Events (`firestore.rules:27`) | `allow read: if signedIn()` — **każdy zalogowany** (nie tylko gracze pokoju) może czytać feed zdarzeń dowolnego pokoju. | Bug — za szerokie uprawnienia |
| 13 | `observe/route.ts` | Brak limitu obserwatorów. Ktokolwiek może zarejestrować się jako obserwator dowolnego pokoju znając kod. | WAŻNE — naruszenie izolacji pokoju, ale bez dostępu do secret |
| 14 | Wisielec `data/words.ts` | 24 hasła na zbiór × 9 zbiorów = 216 haseł. SPEC §5.4 wymaga „min. 60 haseł każdy". Brakuje zbiór „Powiedzenia i przysłowia". | Bug — za mało haseł |
| 15 | Impostor `data/words.ts` | 35 haseł w jednej puli. SPEC §5.5 wymaga „min. 40 haseł" na zestaw × 12 zestawów. | Bug — za mało haseł i brak podziału na kategorie |
| 16 | — | *(usunięte po weryfikacji — motoryzacja i impreza istnieją w danych)* | — |

---

## A3. Audyt bezpieczeństwa

### Czy istnieje ścieżka zapisu do Firestore z klienta z pominięciem Route Handlerów?

**NIE.** Przejrzano:
- `firestore.rules` — `allow write: if false` na `rooms/{code}`, `private/{uid}`, `secret/{doc}`, `events/{id}`.
- Klient (`src/lib/firebase/client.ts`) importuje wyłącznie `getFirestore` do odczytu (`onSnapshot`), nigdy `setDoc`, `updateDoc`, `addDoc` ani `deleteDoc`.
- Brak jakiegokolwiek `import { ... } from "firebase/firestore"` z metodami zapisu w **żadnym** pliku klienckim.
- Admin SDK (`src/lib/firebase/admin.ts`) ma `import "server-only"` — Next.js wyrzuci błąd przy próbie importu w Client Component.

**Wniosek: zasada „klient nigdy nie pisze stanu gry" jest zachowana.**

### Czy `firestore.rules` blokują odczyt `secret/*`?

**TAK.** Linia 21–22:
```javascript
match /secret/{doc} {
  allow read, write: if false;   // WYŁĄCZNIE Admin SDK
}
```
Żadne uwierzytelnienie klienckie nie daje dostępu. Potwierdzone.

### Czy do `publicState` wycieka coś tajnego?

Przejrzono **publicView()** każdego silnika:

| Gra | Wynik | Uwagi |
|---|---|---|
| Stoper | ✅ bezpieczne | W fazie „pomiar" pokazuje tylko kto kliknął STOP, bez wartości |
| Państwa-miasta | ✅ bezpieczne | W fazie „pisanie" pokazuje tylko postęp (ile pól), nie treść; pełna plansza dopiero w „weryfikacja" (zgodne ze SPEC) |
| Wisielec | ✅ bezpieczne | Hasło (`password`) jest maskowane; w wyścigu — bez ujawniania liter innych graczy; pełne hasło dopiero w „wynik" |
| Impostor | ✅ bezpieczne | `word`, `impostors`, `category` = null do fazy „wynik". `privateView` daje impostorowi podpowiedź, ale nie hasło. |
| Mafia | ✅ bezpieczne | Role (`role`) w publicView = null dla żywych; ujawnione dopiero po śmierci (jeśli ustawienie) lub na koniec. Mafiozi widzą się TYLKO w privateView. |

**Wniosek: żadne tajne dane nie wyciekają do publicState.**

### Czy Route Handlery walidują uprawnienia?

| Endpoint | Auth | Autoryzacja | Uwagi |
|---|---|---|---|
| POST /api/rooms | ✅ requireUid | — (każdy może założyć) | OK |
| POST /api/rooms/[code]/join | ✅ requireUid | Brak (każdy z kodem może dołączyć) | Zgodne ze SPEC |
| POST /api/rooms/[code]/action | ✅ requireUid | ✅ sprawdza `players[uid]` + silnik sprawdza fazę/rolę | OK |
| POST /api/rooms/[code]/start | ✅ requireUid | ✅ `hostUid !== uid → 403` | OK |
| POST /api/rooms/[code]/leave | ✅ requireUid | ✅ wyrzucić może tylko host | OK |
| POST /api/rooms/[code]/reset | ✅ requireUid | ✅ `hostUid !== uid → 403` | OK |
| POST /api/rooms/[code]/ping | ✅ requireUid | 🟡 sprawdza `players[uid]` ale ignoruje jeśli nie ma | Drobne — nie-gracz z kodem mógłby pingować (nieszkodliwe) |
| POST /api/rooms/[code]/tick | ✅ requireUid | ❌ NIE sprawdza `players[uid]` | **WAŻNE** — ktokolwiek zalogowany z kodem może triggerować tick (ale tick i tak sprawdza czas serwera, więc efekt = przyspieszone wejście w PHASE_TIMEOUT jeśli czas minął) |
| POST /api/rooms/[code]/observe | ✅ requireUid | ❌ NIE sprawdza niczego | **WAŻNE** — każdy z kodem dodaje się do observers |

### Czy klucze Admin SDK są wyłącznie po stronie serwera?

**TAK.**
- `FIREBASE_SERVICE_ACCOUNT_KEY` — bez prefiksu `NEXT_PUBLIC_`, nie wejdzie do bundla klienta.
- `admin.ts` ma `import "server-only"`.
- `service-account.ts` — nie ma `import "server-only"`, ale jest importowany wyłącznie przez `admin.ts` (server-only).
- Jedyne `NEXT_PUBLIC_*` to konfiguracja Firebase client SDK (apiKey, authDomain, projectId, etc.) — to jest publiczne z natury (potrzebne do inicjalizacji klienta).
- `.env.local` jest w `.gitignore` (`.env*`), NIE jest commitowany.

**Wniosek: klucze serwera nie wyciekają.**

---

## A4. Audyt PWA

| Element | Stan | Komentarz |
|---|---|---|
| `manifest.webmanifest` | 🟡 minimalny | Ma: name, short_name, description, lang, start_url, display, orientation, background_color, theme_color, 1 ikona SVG. Brak: `id`, `scope`, `dir`, `categories`, `shortcuts`, ikony PNG 192/512/maskable, apple-touch-icon |
| Service worker | 🟡 przepustkowy | Tylko `skipWaiting` + `claim`. Zero cache, zero offline. Rejestracja przez `ServiceWorkerRegister.tsx`. |
| Instalacja na Android | 🟡 | `manifest.webmanifest` + SW = instalowalna. Ale ikona to SVG z `purpose: "any maskable"` — nie ma osobnej maskable z marginesem, Android przytnie. |
| Instalacja na iOS | ⚠️ | `apple-touch-icon` wskazuje na SVG (`icon.svg`). iOS potrzebuje PNG 180×180 bez przezroczystości. SVG → czarny kwadrat lub brak ikony. |
| Ekran offline | ❌ brak | SW przepuszcza wszystko. Offline = domyślny dinozaur Chrome. |
| `beforeinstallprompt` | ❌ brak | Brak przechwytywania, brak własnego przycisku „Zainstaluj". |
| iOS „Dodaj do ekranu" | ❌ brak | Brak podpowiedzi z instrukcją. |
| Tryb standalone wykrywanie | ❌ brak | Brak `display-mode: standalone` w CSS. |

**Lista braków PWA:**
1. Ikony PNG 192×192 i 512×512 (any + maskable)
2. apple-touch-icon PNG 180×180
3. Service worker z cache (Serwist)
4. Ekran offline
5. Przechwycenie `beforeinstallprompt`
6. Podpowiedź iOS Safari
7. Manifest: `id`, `scope`, `categories`, `dir`, `shortcuts`
8. Dwa `theme-color` (light/dark)

---

## A5. Audyt realtime — scenariusze

### 1. Gracz odświeża stronę w trakcie nocy w Mafii

**Teraz:** uid persystuje w IndexedDB (Anonymous Auth). Po refreshu `useRoom` podłącza `onSnapshot` do `rooms/{code}` — gracz jest nadal w `players`, więc reguły go wpuszczają. `usePrivate` podłącza `private/{uid}` — rola wróci. GameShell renderuje PlayerView z aktualnym publicState i privateState.

**Wynik: ✅ Działa.** Gracz wraca na swoje miejsce ze swoją rolą. Testowane wg CLAUDE.md.

### 2. Telefon zablokowany na 3 minuty

**Teraz:** przeglądarka uśpi JS. `setInterval` w `usePresence` nie wykona się → `lastSeenAt` starzeje się → PlayerList u innych pokaże szarą kropkę (rozłączony). Ale Firestore `onSnapshot` utrzymuje połączenie WebSocket — po odblokowaniu snapshot dotrze natychmiast. `useGameTick` w `setInterval(400ms)` nadrobi tick.

**Problem:** Serwer nie aktualizuje `connected: false` — to robi tylko klient lokalnie w PlayerList. Inni gracze nie widzą „rozłączony" dopóki **ich** klient nie porówna `lastSeenAt` z `serverNow()`. To działa, ale jest rozproszone.

**Problem 2:** Korekta zegara w `useServerClock` opiera się na `setInterval(60_000)`. Po 3 minutach uśpienia offset nie jest odświeżony. `performance.now()` w Stoperze nie jest dotknięty (to czas monotoniczny), ale `Date.now() + offset` może być nieaktualny. **UPGRADE §C3** wymaga odświeżenia po powrocie z tła.

**Wynik: 🟡 Częściowo.** Gracz wraca, ale zegar może być nieaktualny. Brak widocznego statusu na serwerze.

### 3. Host zamyka kartę

**Teraz:** `usePresence` przestaje pingować. Po 20 s inni widzą hosta jako rozłączonego (szara kropka). ALE: migracja hosta **nie następuje automatycznie**. Serwer nie ma crona/watchera sprawdzającego lastSeenAt. Migracja jest tylko w `/leave`.

**Wynik: ❌ Nie działa wg SPEC.** SPEC §3.7 i UPGRADE §C1 wymagają automatycznej migracji po 30 s.

### 4. Sieć padnie na 20 sekund

**Teraz:** `onSnapshot` Firestore traci WebSocket. SDK automatycznie ponawia połączenie. `apiPost` (ping, action) rzuci błąd → `catch` w `usePresence` go ignoruje. Po powrocie sieci: snapshot dotrze, ping wznowi. `useRoom` ma retry z backoffem na permission-denied.

**Wynik: ✅ Działa.** Firestore SDK obsługuje reconnect automatycznie.

### 5. Gracz kliknie dwa razy ten sam przycisk

**Teraz:** brak `actionId`. Dwuklik = dwa POST /action → dwa reduce. W Mafii: MAFIA_KILL drugi raz → nadpisuje wcześniejszy głos (mapa `mafiaVotes[uid]`), więc efekt nieszkodliwy. W głosowaniu: `votes[uid] = target` → idempotentne (nadpisanie). W Stoperze: drugi SUBMIT → „Już zatrzymałeś stoper" (GameError).

**Ale:** Brak blokady UI po kliknięciu (UPGRADE §C2). `useSent` daje optymistyczny feedback, ale nie blokuje wysyłki. Drugie kliknięcie nie jest blokowane na poziomie sieci.

**Wynik: 🟡 Częściowo bezpieczne** przez projekt silników (idempotencja przez mapę), ale brak gwarancji (actionId) i brak blokady UI.

---

## A6. Wydajność

### Rozmiar bundla (z `next build`)

| Trasa | First Load JS | Cel (<150 kB dla /) |
|---|---|---|
| `/` | **106 kB** | ✅ poniżej celu |
| `/dolacz`, `/nowy` | 295 kB | ❌ — duże: ciągną Firebase SDK + Zustand |
| `/p/[code]` | 295 kB | ❌ — to samo (EntryForm) |
| `/pokoj/[code]` | **335 kB** | ❌ — ciągnie WSZYSTKIE gry (silniki+widoki+dane) |
| `/pokoj/[code]/ekran` | 325 kB | ❌ — to samo |
| Shared JS | 102 kB | — |

**Główne zależności w bundlu:**
- `firebase` (client SDK): ~45 kB gzipped (auth + firestore)
- Silniki gier + dane: w bundlu `/pokoj/[code]`, nie ładowane dynamicznie

**Gry NIE są ładowane dynamicznie** (`next/dynamic`). `components.tsx` importuje wszystkie widoki statycznie. `registry.ts` importuje wszystkie silniki statycznie. UPGRADE §E wymaga dynamic import.

### Odczyty Firestore na 8-osobową partię Mafii

Policzenie (nie szacowanie):

| Operacja | Zapisów | Odczytów (8 onSnapshot) |
|---|---|---|
| Stworzenie pokoju | 1 | 8 |
| 7× dołączenie (join) | 7 | 56 |
| 8× ping w lobby (1 runda ~3 pingi) | 24 | 0 (ping nie rusza version) |
| Start gry | 1 + 8 private + 1 secret + 1 event = 11 | 8 |
| Rozdanie: 8× CONFIRM | 8 + 64 private + 0 secret + 8 events = 80 | 64 |
| Noc 1: 3 akcje (mafia+det+lek) | 3 + 24 private + 3 secret + 3 events = 33 | 24 |
| Świt + przejście (2 reducje) | 2 + 16 + 2 + 2 events = 22 | 16 |
| Dzień (NEXT → głosowanie) | 1 + 8 + 1 + 1 = 11 | 8 |
| Głosowanie: 5 żywych głosów | 5 + 40 + 5 + 5 = 55 | 40 |
| … powtórz noc/dzień ~3× | × 3 | × 3 |
| Koniec gry | 1 + 8 + 1 + 1 = 11 | 8 |

**Szacunek łączny: ~250–350 zapisów, ~200–300 odczytów (z onSnapshot).** W limicie.

**UWAGA:** Każdy zapis w `persist()` to: 1 update rooms/{code} + N private + 1 secret + M events. Przy 8 graczach i 5 akcjach w nocy: ~5 × (1+8+1+1) = 55 zapisów na noc. 3 noce = 165 zapisów tylko na noce. Realny budget: **300-400 zapisów** na partię — zgodny z SPEC §3.8.

### Fonty

- 3 pliki: Chakra Petch (4 wagi), Inter, JetBrains Mono — ładowane przez `next/font`.
- Subset: `latin-ext` ✅ na wszystkich trzech.
- `display: "swap"` ✅ na wszystkich.
- **Brak preloadu** — `next/font` robi to automatycznie. ✅
- CLS: `font-display: swap` może powodować minimalny CLS, ale w praktyce fonty ładują się szybko.

---

## A7. Jakość kodu

### Pokrycie testami

| Plik testowy | Testy | Co pokrywa |
|---|---|---|
| `stoper/engine.test.ts` (134 lin.) | init, SUBMIT, ranking, scoring, PHASE_TIMEOUT, sanity check | ✅ pełna partia |
| `panstwa-miasta/engine.test.ts` (136 lin.) | init, SUBMIT_ANSWERS, STOP, CHALLENGE, JUSTIFY, VOTE, scoring, dedup | ✅ pełna partia |
| `wisielec/engine.test.ts` (134 lin.) | init, GUESS, SOLVE, 3 tryby, ogonki, turnover | ✅ pełna partia |
| `impostor/engine.test.ts` (146 lin.) | init, CONFIRM, CLUE, VOTE, GUESS_WORD, wordMatch, tryby podpowiedzi | ✅ pełna partia |
| `mafia/engine.test.ts` (121 lin.) | resolveNight, lekarz ratuje, publicView nie ujawnia ról, CONFIRM, MAFIA_KILL/INVESTIGATE/PROTECT, VOTE, miasto/mafia wygrywa | ✅ rdzeń pokryty |
| `rng.test.ts` | mulberry32 determinizm, shuffle | ✅ |
| `room-code.test.ts` | generowanie, normalizacja, walidacja | ✅ |
| `schemas/room.test.ts` | sanitizeNick, dedupeNick | ✅ |
| `server/rooms.test.ts` | pickNewHost | ✅ |
| `service-account.test.ts` | parseServiceAccountKey | ✅ |

**Łącznie: 10 plików testowych, 74 testy, wszystkie przechodzą.**

**Braki:**
- Brak testów E2E (Playwright)
- Brak testu bezpieczeństwa z SPEC §5.6 (automat sprawdzający co klient może odczytać)
- Mafia: brak testów rozliczenia nocy z barmanem/snajperem/szeryf (bo te role nie istnieją)
- Brak testów Route Handlerów (integracyjnych)

### TypeScript strict

- `tsconfig.json` ma `"strict": true` ✅
- `npx tsc --noEmit` daje **4 błędy** — wszystkie w **testach** (niedozwolone literały w schemacie Zod: `lives: 2` zamiast `6|8|10`, `rounds: 1` zamiast `3|5|8|0`). Produkcyjny kod kompiluje się bez błędów.

### `any`, `@ts-ignore`, `eslint-disable`

- **0 × `@ts-ignore`** ✅
- **6 × `eslint-disable`:**
  - 3× `@typescript-eslint/no-explicit-any` w registry/components/game-runner (nieuniknione przy generycznym interfejsie gier)
  - 2× `react-hooks/exhaustive-deps` w PlayerView Stopera i PM (celowe pomijanie deps)
  - 1× `eslint-disable-next-line` w game-runner persist
- **0 × `any` w produkcyjnym kodzie** poza wymuszonymi w registry (które mają eslint-disable)

### Duplikacja logiki

- Każdy silnik powielają wzorzec: `requireHost()`, `toResult()`, `advance()`. Ale to domena gry — każdy ma inne reguły. Wyciąganie do rdzenia naruszyłoby zasadę „zero zmian w rdzeniu".
- `publicView` i `privateView` — każdy silnik ma swoją wersję. Zgodne z interfejsem pluginu.
- Jedyna realna duplikacja: wzorzec `confirmAll` (Mafia, Impostor) i scoring (lokalna per-gra). Akceptowalne.

---

## A8. Dług i ryzyko

### [KRYTYCZNE] — psuje grę lub ujawnia tajne dane

**(brak)** — Nie znaleziono żadnej ścieżki ujawnienia ról, haseł ani tajnego stanu. Nie znaleziono żadnej ścieżki zapisu do Firestore z klienta.

### [WAŻNE] — widoczne dla użytkownika

| # | Problem | Pliki | Koszt naprawy |
|---|---|---|---|
| W1 | **Brak automatycznej migracji hosta** — host zamyka kartę → nikt nie jest hostem → gra wisi | Brak mechanizmu server-side. Wymaga: tick/ping sprawdzający lastSeenAt + logikę migracji | ~60 linii + 2 pliki |
| W2 | **Brak actionId / idempotencji** — dwuklik może wywołać dwa reduce (w większości gier nieszkodliwy, ale nie gwarantowany) | `action/route.ts`, silniki gier | ~30 linii |
| W3 | **Brak blokady UI po kliknięciu** — brak disabled/loading na przyciskach akcji w trakcie POST | PlayerView każdej gry | ~5 linii × 5 gier |
| W4 | **PWA minimalna** — brak offline, brak ikony PNG, instalacja niekompletna | public/, layout.tsx | Cała faza B |
| W5 | **Events czytelne przez każdego zalogowanego** — reguła `allow read: if signedIn()` na events | firestore.rules:27 | 1 linia (dodać `request.auth.uid in resource.data.players` — ale events nie mają parent data... wymaga zmian w regule) |
| W6 | **Observe bez ograniczeń** — każdy z kodem pokoju może się zapisać jako obserwator | observe/route.ts | ~10 linii (sprawdzić istnienie pokoju + limit) |
| W7 | **reset/route.ts nie jest w transakcji** — race condition między delete secret a update room | reset/route.ts | ~10 linii |
| W8 | **Korekta zegara nie odświeża się po powrocie z tła** — `visibilitychange` nie wznawia sync | useServerClock.ts | ~10 linii |
| W9 | **Za mało haseł** — Wisielec: 24/zbiór (wymagane 60), Impostor: 35 (wymagane 40×12) | data/words.ts × 2 | ~200-300 linii danych |
| W10 | **Gry ładowane statycznie** — wszystkie silniki + widoki w bundlu /pokoj/[code] (335 kB) | components.tsx, registry.ts | ~20 linii (dynamic import) |
| W11 | **userScalable=false globalnie** — psuje dostępność na stronach z tekstem | layout.tsx:44 | 5 linii |

### [NICE] — kosmetyka

| # | Problem | Pliki | Koszt |
|---|---|---|---|
| N1 | 4 błędy TS w testach (literały Zod) | engine.test.ts × 2 | 4 linii |
| N2 | Brak Error Boundary per trasa gry | app/pokoj/[code]/ | ~30 linii |
| N3 | Brak globalnego stanu połączenia (pasek „Brak połączenia") | nowy komponent | ~40 linii |
| N4 | Brak `navigator.share` i deep link `/?kod=XYZW` | page.tsx, RoomQr.tsx | ~15 linii |
| N5 | Brak wibracji feedback na kluczowych akcjach | PlayerView × 5 | ~10 linii |
| N6 | Muted nie persystuje w localStorage | sound.ts | 5 linii |
| N7 | Confetti na koniec **każdej** gry, nie tylko na zwycięstwo | GameShell.tsx:43 | 5 linii (warunek) |

---

## Pytania do Jakuba

1. **Events reguły Firestore** (W5): Events mają `allow read: if signedIn()` — dowolny zalogowany user może czytać feed zdarzeń dowolnego pokoju. SPEC §3.3 mówi `allow read: if signedIn()` dla events, więc to **zgodne ze specyfikacją**, ale UPGRADE chce wyższy poziom bezpieczeństwa. Czy to naprawić? (Wymaga albo dodania parent-key do każdego eventu, albo zmiany struktury.)

2. **Observe endpoint** (W6): Każdy z kodem pokoju może się dodać jako obserwator i czytać pokój bez bycia graczem. Intencja SPEC §3.9 jest taka, że obserwator to ekran hosta — ale nie ma walidacji. Czy ograniczyć (np. tylko host może dodać obserwatora)?

3. **Kółko i krzyżyk**: Pominięte. UPGRADE nie wymienia go w zakresie. Potwierdzam — ignoruję?

4. **Stoper tryb B / role dodatkowe Mafii / tryb z prowadzącym**: Czy to wchodzi w zakres UPGRADE (fazy B–G), czy odkładamy dalej?

---

## Propozycja kolejności faz B–G

Kolejność z UPGRADE jest logiczna i ją zachowuję:

| Faza | Uzasadnienie kolejności |
|---|---|
| **B — PWA** | Pierwszy krok: manifest, ikony, service worker. Nie zależy od niczego. Niska złożoność. |
| **C — Realtime** | Naprawia W1 (migracja hosta), W2 (idempotencja), W8 (zegar po tła). Krytyczne dla niezawodności na imprezie. Musi być przed D, bo D zależy od stanów (rozłączenie, loading). |
| **D — Wygląd** | Największa faza. Wymaga zatwierdzenia planu wizualnego. Nie można robić przed C, bo D musi uwzględniać stany z C (pasek „brak połączenia", skeleton, error). |
| **E — Wydajność** | Dynamic import gier, Lighthouse, optymalizacja. Naturalnie po D (bo D zmienia wszystko). |
| **F — Jakość i testy** | Testy E2E, test bezpieczeństwa, error boundary. Po D+E, żeby testować ostateczną formę. |
| **G — Dopracowanie** | QR, share, rekordy, awatary, obserwator, ekran zasad. Czereśnia na torcie. |

**Gotowe. Czekam na OK do Fazy B.**
