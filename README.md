<p align="center">
  <img src="public/icon-512.png" width="96" height="96" alt="Domówka logo" style="border-radius: 20px" />
</p>

<h1 align="center">Domówka</h1>

<p align="center">
  Imprezowe gry multiplayer w przeglądarce. Każdy na swoim telefonie, jeden wspólny pokój.
  <br />
  <a href="https://domowka.vercel.app"><strong>🔗 domowka.vercel.app</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/Firebase-Firestore+Auth-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/PWA-instalowalna-5A0FC8?logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/multiplayer-realtime-E4002B" alt="Multiplayer Realtime" />
</p>

---

## O aplikacji

**Domówka** to zestaw imprezowych gier multiplayer, w które gracie na jednym spotkaniu — każdy na swoim telefonie. Bez kont, bez pobierania, bez tłumaczenia zasad. Jedna osoba zakłada pokój, reszta wpisuje 4-znakowy kod i za **15 sekund gracie**.

### Jak to działa?

1. 🏠 **Host zakłada pokój** — dostaje 4-literowy kod + QR
2. 📱 **Gracze dołączają** — wpisują kod na swoim telefonie (lub skanują QR)
3. 🎮 **Host wybiera grę** — ustawienia, start, gramy!
4. 🔄 **Kolejna runda** — po zakończeniu wracasz do lobby i wybierasz następną

## Gry

| Gra | Emoji | Opis | Gracze |
|---|---|---|---|
| **Stoper** | ⏱️ | Zatrzymaj w idealnym momencie. Bez patrzenia na cyfry. | 1–16 |
| **Państwa-miasta** | ✍️ | Litera pada, długopisy w ruch. Kto pierwszy, ten lepszy. | 1–16 |
| **Wisielec** | 🪢 | Zgadnij hasło, zanim ludzik zawiśnie. 3 tryby: wyścig, kooperacja, zadający. | 1–16 |
| **Impostor** | 🕵️ | Wszyscy znają hasło. Prawie wszyscy. Znajdź kreta albo giń. | 3–16 |
| **Mafia** | 🔪 | Miasto śpi. Mafia nie. Pełny auto-narrator z rolami specjalnymi. | 4–16 |

## Funkcje

### Pokój i lobby
- **4-znakowy kod pokoju** — neonowy szyld, kliknij żeby skopiować
- **QR code** — skan z telefonu, zero wpisywania
- **Deep link** — `domowka.vercel.app/?kod=XYZW` wchodzi prosto do pokoju
- **Udostępnianie** — przycisk Share (native share / clipboard fallback)
- **Ekran hosta (TV)** — duży ekran na laptopie/TV z kodem 8rem, QR 280px, efektem CRT
- **Awatary** — 30 emoji do wyboru przy dołączaniu
- **Zasady gier** — modal z krokami dla każdej gry

### Realtime multiplayer
- **Anonimowa autoryzacja** — Firebase Anonymous Auth, zero rejestracji
- **Presence** — zielona/szara kropka, kto jest online
- **Reconnect** — powrót do pokoju po odświeżeniu/zamknięciu (localStorage)
- **Migracja hosta** — gdy host zniknie na >30s, inny gracz przejmuje
- **Idempotencja** — actionId (UUID) zapobiega podwójnym akcjom
- **Pasek połączenia** — czerwony "Brak połączenia", zielony "✓ Połączono"
- **Wykładniczy backoff** — 500ms → 1s → 2s → ... → 16s max

### Bezpieczeństwo
- **Klient NIGDY nie zapisuje stanu gry** — wszystkie zapisy przez Route Handlery + `firebase-admin`
- **Role i hasła tajne** — żyją w `rooms/{kod}/secret/state` (Firestore: `allow read: if false`)
- **Dane prywatne per gracz** — `rooms/{kod}/private/{uid}` (tylko Twoje)
- **Zero wycieków w DevToolsach** — role Mafii i hasło Impostora niewidoczne po stronie klienta

### PWA i mobile
- **Instalowalna** — manifest + Service Worker (Serwist), prompt instalacji, iOS hint
- **Offline** — dedykowana strona offline, NetworkOnly dla API i Firebase
- **Wake Lock** — ekran nie gaśnie w trakcie gry
- **Wibracje** — haptic feedback na akcjach (z opcją wyłączenia)
- **Visual Viewport** — `--vvh` dla klawiatur mobilnych
- **Safe areas** — `env(safe-area-inset-*)` na notch/dynamic island

### Wygląd i UX
- **Neonowy motyw** — ciemne tło z fioletowym podkładem, neonowe akcenty per gra
- **Animacje** — slideIn, fadeIn, timer pulse, neon flicker
- **SFX** — WebAudio: join, phase change, urgent tick, fanfara, defeat, neon buzz
- **Konfetti** — canvas-confetti na wygraną z kolorami gry
- **Skeleton loader** — animowany placeholder w lobby
- **prefers-reduced-motion** — pełne wsparcie

## Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Język | TypeScript (strict, zero `any`) |
| Baza danych | Cloud Firestore (realtime `onSnapshot`) |
| Autoryzacja | Firebase Anonymous Auth |
| Serwer | Route Handlers + `firebase-admin` |
| PWA | Serwist (Service Worker, manifest, offline) |
| Testy | Vitest (74 testy — pełne partie + bezpieczeństwo) |
| Deploy | Vercel (auto-deploy z GitHub) |
| Dźwięki | Web Audio API (zero plików audio) |
| QR | `qrcode` (generowanie SVG) |
| Czcionki | Chakra Petch (display), Inter (body), JetBrains Mono (mono) |

## Architektura

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # root layout, fonty, PWA, ConnectionBar
│   ├── page.tsx                # landing page + deep link /?kod=
│   ├── nowy/                   # zakładanie pokoju
│   ├── dolacz/                 # dołączanie do pokoju
│   ├── pokoj/[code]/           # ekran gracza (lobby + gra)
│   │   └── ekran/              # ekran hosta na TV (CRT efekt)
│   ├── ~offline/               # strona offline (PWA)
│   └── api/rooms/              # Route Handlers (jedyne miejsce zapisu!)
│       ├── route.ts            # POST — tworzenie pokoju
│       └── [code]/
│           ├── join/           # dołączanie
│           ├── leave/          # wyjście
│           ├── ping/           # presence + migracja hosta
│           ├── start/          # start gry
│           ├── action/         # akcja gracza (idempotentna)
│           ├── tick/           # tick fazy (timer)
│           ├── reset/          # powrót do lobby (transakcja)
│           └── observe/        # tryb obserwatora (ekran hosta)
│
├── games/                      # Silniki i UI gier (plugin architecture)
│   ├── registry.ts             # rejestr silników (serwer)
│   ├── manifests.ts            # manifesty gier (klient — bez silników)
│   ├── components.tsx          # UI gier (dynamic imports)
│   ├── types.ts                # interfejsy GameEngine, GameManifest
│   ├── view.ts                 # interfejsy GameViewProps
│   ├── stoper/                 # ⏱️ Stoper
│   │   ├── engine.ts           # czysta funkcja: init → action → state
│   │   ├── manifest.ts         # metadata + settings schema (Zod)
│   │   ├── Settings.tsx        # panel ustawień
│   │   ├── PlayerView.tsx      # widok gracza
│   │   └── HostView.tsx        # widok na TV
│   ├── panstwa-miasta/         # ✍️ Państwa-miasta
│   ├── wisielec/               # 🪢 Wisielec
│   ├── impostor/               # 🕵️ Impostor
│   └── mafia/                  # 🔪 Mafia
│
├── components/                 # Komponenty React
│   ├── game/                   # GameShell, LobbyGames, GameRulesCard
│   ├── RoomCodeNeon.tsx        # neonowy kod pokoju (click-to-copy)
│   ├── RoomQr.tsx              # QR code pokoju
│   ├── PlayerList.tsx          # lista graczy z presence
│   ├── ShareButton.tsx         # udostępnianie (navigator.share)
│   ├── ConnectionBar.tsx       # pasek online/offline
│   ├── InstallPrompt.tsx       # prompt instalacji PWA
│   ├── ErrorBoundary.tsx       # error boundary per gra
│   └── LobbySkeleton.tsx       # skeleton loader
│
├── hooks/                      # Custom hooks
│   ├── useRoom.ts              # Firestore onSnapshot + backoff
│   ├── usePresence.ts          # ping co 10s (debounce)
│   ├── useServerClock.ts       # synchronizacja zegara (NTP-like)
│   ├── usePrivate.ts           # private/{uid} listener
│   ├── useGameTick.ts          # auto-tick gdy faza wygasa
│   ├── useAnonAuth.ts          # Firebase Anonymous Auth
│   ├── useWakeLock.ts          # Screen Wake Lock API
│   ├── useVibrate.ts           # Vibration API (z opt-out)
│   └── useVisualViewport.ts    # Visual Viewport API (--vvh)
│
├── lib/                        # Infrastruktura
│   ├── server/game-runner.ts   # applyAction, persist, idempotencja
│   ├── client/api.ts           # apiPost z obsługą błędów
│   ├── sound.ts                # WebAudio SFX (10 dźwięków)
│   ├── confetti.ts             # canvas-confetti wrapper
│   ├── action-id.ts            # crypto.randomUUID()
│   ├── store/session.ts        # Zustand (activeRoom)
│   └── types/room.ts           # Room, Player, RoomStatus
│
└── sw.ts                       # Service Worker (Serwist)
```

### Kluczowe decyzje projektowe

- **Klient read-only** — klient NIGDY nie zapisuje do Firestore. Wszystko przez Route Handlery + `firebase-admin`. Złamanie tej zasady wycieka role w DevToolsach.
- **Silniki to czyste funkcje** — zero `Date.now()`, zero `Math.random()`. Czas i losowość wchodzą przez `ctx.now` i `ctx.rng`. W pełni deterministyczne, w pełni testowalne.
- **Plugin architecture** — dodanie nowej gry = nowy folder w `src/games/` + jedna linia w `registry.ts`. Zero zmian w rdzeniu.
- **Dynamic imports** — komponenty gier ładowane dynamicznie (`next/dynamic`). Gracz pobiera tylko kod aktualnej gry, nie wszystkich pięciu.
- **Tajne dane w trzech warstwach** — `publicState` (wszyscy widzą), `secret/state` (nikt nie czyta, `allow read: if false`), `private/{uid}` (tylko Twoje).
- **Timer bez crona** — serwer pisze `phaseEndsAt`, klienci odliczają, pierwszy gracz po czasie odpala `/tick`. Zero cron jobów.
- **Wszystko po polsku** — UI, nazwy, fonty z `latin-ext` (Ą Ć Ę Ł Ń Ó Ś Ź Ż).

## Uruchomienie lokalne

### Wymagania

- Node.js 22+
- Projekt Firebase z Firestore i Authentication (Anonymous)

### Instalacja

```bash
git clone https://github.com/w84kubus/domowka.git
cd domowka
npm install
```

### Konfiguracja

Utwórz plik `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# firebase-admin (Route Handlers)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@...iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Komendy

```bash
npm run dev        # serwer deweloperski (localhost:3000)
npm run build      # produkcyjny build
npm run lint       # eslint
npm run test       # vitest run (74 testy)
```

## Instalacja na telefonie (PWA)

Aplikacja jest w pełni instalowalna jako PWA:

| Platforma | Instrukcja |
|---|---|
| **iOS** | Safari → Udostępnij (↑) → *Dodaj do ekranu początkowego* |
| **Android** | Chrome → Menu (⋮) → *Zainstaluj aplikację* / automatyczny prompt |

Po instalacji działa w pełnym ekranie z własną ikoną. Ekran hosta (TV) utrzymuje się aktywny dzięki Wake Lock.

## Licencja

Projekt prywatny. Kod źródłowy dostępny publicznie w celach edukacyjnych.
