# public/assets — obrazy gotowe do podania na stronę

Tu leżą **przetworzone** pliki: tło wycięte, przycięte do zawartości, wyeksportowane
w @1x i @2x. Nic tutaj nie edytujemy ręcznie — wszystko wychodzi ze skryptu
`scripts/process-assets.py`, którym karmimy surowe pliki z Gemini.

```
postacie/   ziomki wycięte na przezroczystość (PNG + alfa)
sceny/      ilustracje „jak grać" (PNG + alfa)
tla/        tła pod tekst renderowany w HTML (WebP, bez alfy)
```

Surowe pliki z generatora wrzucamy do `assets/zrodla/` (poza `public/`, nie idą na produkcję).
Manifest i prompty: `assets/ASSETS.md`, `assets/PROMPTS.md`.
