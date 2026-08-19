# Prompt do Gemini (Nano Banana) — pakiet ikon dla Domówki

> **Jak tego użyć:** wklejaj do Gemini **etap po etapie**, nie wszystko naraz.
> Etap 1 ustala styl. Etapy 2–6 dogrywają resztę, **odwołując się do obrazka z etapu 1**
> (załącz go w rozmowie) — bez tego każda partia wyjdzie w innym stylu i pakiet się rozjedzie.

---

## ETAP 1 — klucz stylu (6 awatarów)

```
Jesteś ilustratorem UI. Tworzysz pakiet ikon-awatarów do imprezowej gry mobilnej
w stylu "arcade party": soczysty, kreskówkowy, radosny.

STYL — trzymaj się go rygorystycznie, to jest klucz dla całego pakietu:
- Kreskówkowy 3D, bąbelkowy, pucołowaty. Miękkie zaokrąglone kształty, zero ostrych kantów.
- Gruby, jednolity kontur w kolorze ciemnego fioletu (#2A1758), grubość identyczna
  we wszystkich ikonach.
- Delikatny gradient wypełnienia + jeden miękki refleks świetlny w lewym górnym rogu.
  Źródło światła zawsze z lewej góry, w każdej ikonie tak samo.
- Nasycone, wesołe kolory. Ikony będą leżeć na fioletowo-różowym tle (#4B1FA8 → #C0398F),
  więc muszą być od niego wyraźnie jaśniejsze i kontrastowe. Unikaj fioletu jako
  koloru dominującego ikony.
- Płaska, czytelna sylwetka — ikona musi być rozpoznawalna po zmniejszeniu do 40 px.
  Zero drobnych detali, cieniutkich kresek, tekstur i napisów.
- Zwierzęta: same głowy/pyszczki en face, przyjazne, uśmiechnięte. Bez ciał.
- Przedmioty: ujęcie lekko z przodu, prosta bryła.

WYMAGANIA TECHNICZNE:
- Format kwadratowy 1:1, tło CAŁKOWICIE PRZEZROCZYSTE (alfa), bez cienia rzuconego na tło.
- Motyw wyśrodkowany, z marginesem ok. 10% z każdej strony.
- Wszystkie ikony w tej samej skali wizualnej — pyszczek kota ma zajmować tyle samo
  kadru co pyszczek pandy.
- Bez tekstu, bez podpisów, bez ramek, bez numeracji.

ZADANIE:
Wygeneruj 6 osobnych ikon, każdą jako oddzielny obrazek:
1. cat — pyszczek kota, pomarańczowo-rudy
2. dog — pyszczek psa, jasnobrązowy
3. panda — pyszczek pandy, biało-czarny
4. rabbit — pyszczek królika, kremowy
5. fish — rybka, turkusowo-niebieska
6. flame — płomień, pomarańczowo-czerwony

Nazwij pliki dokładnie: cat.png, dog.png, panda.png, rabbit.png, fish.png, flame.png
```

---

## ETAP 2 — zwierzęta, część 1

```
Załączam ikony z poprzedniego etapu jako wzorzec stylu.
Wygeneruj kolejne 6 ikon w DOKŁADNIE tym samym stylu, konturze, skali i oświetleniu.
Te same wymagania techniczne (1:1, tło przezroczyste, margines 10%, bez tekstu).

1. bird — ptaszek, żółto-niebieski
2. squirrel — wiewiórka, rudobrązowa
3. turtle — żółw, zielony
4. bug — biedronka/żuczek, czerwono-czarny
5. rat — myszka, szara
6. snail — ślimak, beżowo-brązowy

Nazwy: bird.png, squirrel.png, turtle.png, bug.png, rat.png, snail.png
```

---

## ETAP 3 — zwierzęta, część 2

```
Ten sam styl co poprzednio (załączam wzorzec). Te same wymagania techniczne.

1. worm — robaczek, różowy
2. shell — muszla, kremowo-różowa
3. feather — piórko, jasnoniebieskie
4. egg — jajko, kremowe
5. paw — odcisk łapy, fioletowo-liliowy
6. ghost — duszek, biało-błękitny

Nazwy: worm.png, shell.png, feather.png, egg.png, paw.png, ghost.png
```

---

## ETAP 4 — przedmioty, część 1

```
Ten sam styl co poprzednio (załączam wzorzec). Te same wymagania techniczne.
Przedmioty rysuj jako proste, pucołowate bryły — ta sama bąbelkowa stylistyka
co zwierzęta, ten sam gruby kontur.

1. pizza — kawałek pizzy
2. beer — kufel piwa z pianką
3. guitar — gitara elektryczna, czerwona
4. rocket — rakieta, biało-czerwona
5. bot — głowa robota, srebrno-niebieska
6. gamepad — pad do gier, ciemnoszary z kolorowymi przyciskami

Nazwy: pizza.png, beer.png, guitar.png, rocket.png, bot.png, gamepad.png
```

---

## ETAP 5 — przedmioty, część 2

```
Ten sam styl co poprzednio (załączam wzorzec). Te same wymagania techniczne.

1. skull — czaszka, kremowo-biała, wesoła nie straszna
2. crown — korona, złota
3. diamond — diament, jasnoniebieski
4. anchor — kotwica, granatowo-srebrna
5. bike — rower, turkusowy
6. zap — błyskawica, żółta

Nazwy: skull.png, crown.png, diamond.png, anchor.png, bike.png, zap.png
```

---

## ETAP 6 — ikony pięciu gier

```
Ten sam styl co poprzednio (załączam wzorzec), ale te ikony są WIĘKSZE w użyciu
(do 80 px), więc mogą mieć odrobinę więcej detalu. Nadal: gruby kontur #2A1758,
światło z lewej góry, tło przezroczyste, format 1:1, margines 10%, bez tekstu.

Każda ikona ma dominujący kolor podany niżej — to kolor akcentu danej gry
w aplikacji, więc trzymaj się go:

1. stoper — stoper/sekundnik, dominująca limonka #CCFF00
2. panstwa-miasta — ołówek piszący po kartce, dominujący cyjan #22D3EE
3. wisielec — czaszka z pętlą/sznurem, dominujący bursztyn #FFB627
4. impostor — maska weneckia / maska szpiega, dominująca magenta #FF2D95
5. mafia — kapelusz fedora z przepaską, dominująca czerwień #E4002B

Nazwy: stoper.png, panstwa-miasta.png, wisielec.png, impostor.png, mafia.png
```

---

## Czego potrzebuję od Ciebie na końcu

**35 plików PNG** o dokładnie tych nazwach (to są identyfikatory z kodu — nie zmieniaj ich):

**Awatary (30):**
`cat` `dog` `bird` `rabbit` `panda` `squirrel` `fish` `turtle` `bug` `rat`
`snail` `worm` `shell` `feather` `egg` `paw` `pizza` `beer` `guitar` `rocket`
`bot` `ghost` `skull` `flame` `gamepad` `crown` `diamond` `anchor` `bike` `zap`

**Gry (5):**
`stoper` `panstwa-miasta` `wisielec` `impostor` `mafia`

### Jeśli coś nie wyjdzie idealnie — nie szkodzi

- **Tło nie jest przezroczyste?** Poradzę sobie — mogę je wyciąć programowo, o ile
  jest jednolite (najlepiej czysta biel albo magenta). Powiedz mi tylko, że tak jest.
- **Rozmiar?** Cokolwiek od 512×512 w górę. Sam przeskaluję i skompresuję do WebP.
- **Któraś ikona odstaje stylem?** Wyślij i tak — powiem, którą warto wygenerować ponownie.

---

## Czego świadomie NIE zmieniamy

Ikony interfejsu (zamknij, zaznaczone, udostępnij, głośnik, strzałki, gwiazdka hosta,
ostrzeżenie, faza dnia/nocy w Mafii) zostają na **Lucide SVG**. Powód: wyświetlają się
w 12–20 px, muszą być ostre na każdym ekranie, zmieniać kolor przy najechaniu i stanach,
a jako SVG ważą ułamek tego co PNG. Wygenerowana grafika rastrowa byłaby tam gorsza,
nie lepsza.
