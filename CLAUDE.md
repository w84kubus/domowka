# Domówka — pamięć projektu

## Co to jest

Multiplayerowe gry imprezowe w przeglądarce. Każdy gracz na swoim telefonie, wspólny pokój z 4-znakowym kodem. Gry: kółko i krzyżyk, Stoper, Państwa-miasta, Wisielec, Impostor, Mafia.

Stack: Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + Firebase (Firestore + Anonymous Auth) + Vercel.

## Specyfikacja

Pełny spec: **`SPEC.md`** w rootcie repo. Nie jest ładowany automatycznie — czytaj na żądanie.

- Przed pracą nad grą: przeczytaj sekcję 3 (architektura) + sekcję tej gry (5.x).
- Po `/compact`: przeczytaj sekcję 3 ponownie.

## Zasady nienegocjowalne

1. **IMPORTANT: Klient NIGDY nie zapisuje stanu gry do Firestore.** Wszystkie zapisy idą przez Route Handlery + `firebase-admin`. Klient tylko czyta (`onSnapshot`). Złamanie tej zasady rozwala Mafię i Impostora — role byłyby widoczne w DevToolsach.

2. Role, tajne hasła i odpowiedzi innych graczy nigdy nie trafiają do `publicState`. Tajne dane żyją w `rooms/{kod}/secret/state` (reguła: `allow read: if false`) i `rooms/{kod}/private/{uid}`.

3. `engine.ts` każdej gry jest **czystą funkcją**. Zero `Date.now()`, zero `Math.random()`. Czas i losowość wchodzą przez `ctx.now` i `ctx.rng`.

4. Dodanie nowej gry = nowy folder w `src/games/` + jedna linia w `registry.ts`. **Zero zmian w rdzeniu.** Jeśli uważasz, że rdzeń wymaga zmiany — zatrzymaj się i zapytaj. Nie zmieniaj po cichu.

5. Wszystko po polsku. Fonty muszą mieć `latin-ext` (Ą Ć Ę Ł Ń Ó Ś Ź Ż). **Press Start 2P, Orbitron i VT323 nie mają polskich znaków — nie używaj.**

6. Mobile-first. Przyciski min. 56 px. `100dvh`, nie `100vh`. Pomiar czasu w Stoperze: `performance.now()`, nigdy `setInterval`.

7. `export const runtime = 'nodejs'` w każdym Route Handlerze — `firebase-admin` nie działa na Edge.

## Styl pracy

- Rób tylko bieżącą fazę. Nie refaktoruj rzeczy spoza zakresu.
- Gdy wahasz się między dwoma podejściami — przedstaw oba i zapytaj, nie decyduj sam.
- Przed zgłoszeniem „gotowe" odpal `npm test` i `npm run build`. Oba muszą przejść.
- Commit po każdej fazie, nie jeden wielki commit na końcu.

## Komendy

```
npm run dev
npm run build
npm test
npm run lint
firebase deploy --only firestore:rules
```

## Stan projektu

<!-- odhaczaj po każdej fazie -->

- [ ] Faza 0 — setup, Firebase, auth, deploy hello-world na Vercel
- [ ] Faza 1 — pokoje, lobby, presence, reconnect, QR, ekran hosta
- [ ] Faza 2 — silnik gier + registry + kółko i krzyżyk
- [ ] Faza 3 — Stoper
- [ ] Faza 4 — Państwa-miasta
- [ ] Faza 5 — Wisielec
- [ ] Faza 6 — Impostor
- [ ] Faza 7 — Mafia
- [ ] Faza 8 — polish (dźwięki, animacje, PWA)
