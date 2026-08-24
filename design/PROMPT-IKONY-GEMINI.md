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

## ETAP 7 — ikona szóstej gry: Odcień

> **Załącz do rozmowy którąś z gotowych ikon gier** (np. `budzik.png` albo `wisielec.png`).
> Bez wzorca pojedyncza nowa ikona wyjdzie w innym stylu i będzie odstawać od reszty —
> to jedyny naprawdę krytyczny punkt tego etapu.

```
Załączam gotową ikonę z mojego pakietu jako wzorzec stylu.

Wygeneruj JEDNĄ nową ikonę gry w DOKŁADNIE tym samym stylu: kreskówkowy 3D, bąbelkowy,
gruby jednolity kontur w ciemnym fiolecie (#2A1758), miękki refleks świetlny z lewej góry,
nasycone kolory, płaska czytelna sylwetka.

WYMAGANIA TECHNICZNE (jak poprzednio):
- Format kwadratowy 1:1, tło CAŁKOWICIE PRZEZROCZYSTE, bez cienia rzuconego na tło.
- Motyw wyśrodkowany, margines ok. 10% z każdej strony.
- Ta sama skala wizualna co ikona wzorcowa.
- Bez tekstu, bez podpisów, bez ramek.
- Minimum 512×512.

GRA: „Odcień" — gracz widzi kolor przez kilka sekund, kolor znika, a potem odtwarza go
z pamięci trzema suwakami. Gra jest O KOLORZE, więc to jedyna ikona w pakiecie, która
MOŻE być wielobarwna — pozostałe mają jeden kolor dominujący, ta nie musi.

MOTYW: paleta malarska (klasyczny owal z otworem na kciuk) z trzema albo czterema
błyszczącymi kleksami farby. Korpus palety w ciepłym pomarańczu #FF8A3D — to kolor
akcentu tej gry. Kleksy w wyraźnie różnych barwach (np. róż, turkus, limonka, żółć),
każdy z własnym refleksem, jak krople gęstej farby.

WAŻNE: ikona musi być rozpoznawalna po zmniejszeniu do 40 px. Kleksy mają być duże
i wyraźnie oddzielone — nie rób drobnych plamek ani cienkich pędzelków.

Nazwa pliku: odcien.png
```

### Wariant alternatywny (jeśli paleta nie wyjdzie)

```
Ten sam styl i te same wymagania techniczne co wyżej.

Zamiast palety: trzy grube, poziome suwaki jeden pod drugim, każdy z pucołowatą
okrągłą gałką w innym kolorze (róż, turkus, limonka). Tory suwaków w ciepłym
pomarańczu #FF8A3D. To ma czytać się jak „regulujesz kolor", a nie jak zwykłe menu.

Nazwa pliku: odcien.png
```

---

## ETAP 8 — ikona siódmej gry: Kasyno — ZROBIONE

Ikona przyszła jako zrzut ekranu (JPEG z wypaloną szachownicą „przezroczystości"),
nie jako PNG z kanałem alfa. Tło wycięte programowo: szachownica i cień to czyste
szarości, a naklejka ma wszędzie ciemnofioletowy kontur o wyraźnej chromie — więc
rozlewanie od krawędzi obrazu po pikselach o chromie < 30 zatrzymuje się dokładnie
na konturze. Przy okazji znika biała otoczka naklejki, której pozostałe ikony
w pakiecie i tak nie mają.

MOTYW: koło fortuny w złotej obręczy z nitami, w środku okienko slota z trzema
bębnami (wiśnie / siódemka / cytryna), obok dźwignia z czerwoną gałką, na dole
stosik żetonów i moneta „2x". Akcent gry: złoto #F0B429.

Nazwa pliku: kasyno.png

---

## Czego potrzebuję od Ciebie na końcu

**37 plików PNG** o dokładnie tych nazwach (to są identyfikatory z kodu — nie zmieniaj ich):

**Awatary (30):**
`cat` `dog` `bird` `rabbit` `panda` `squirrel` `fish` `turtle` `bug` `rat`
`snail` `worm` `shell` `feather` `egg` `paw` `pizza` `beer` `guitar` `rocket`
`bot` `ghost` `skull` `flame` `gamepad` `crown` `diamond` `anchor` `bike` `zap`

**Gry (7):**
`stoper` `panstwa-miasta` `wisielec` `impostor` `mafia` `odcien` `kasyno`

> **Uwaga o nazwach:** nazwy plików są wygodne, ale nie krytyczne — przy poprzednim
> pakiecie przyszły po polsku (`budzik.png`, `karty-2.png`) i po prostu je zmapowałem.
> Ważniejsze, żeby styl się zgadzał.

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
