# Implementacja Arcade Party — gotowy kod referencyjny

Ten plik zawiera działający kod z projektu-prototypu. Użyj go jako bazy
do implementacji w DOMÓWCE — dostosuj do istniejących klas (.btn, .card, .screen).

---

## 1. Tokeny (@theme w globals.css)

```css
@theme {
  /* Tło i rama */
  --color-frame:        #140A24;
  --color-bg-1:         #4B1FA8;
  --color-bg-2:         #7A2CC0;
  --color-bg-3:         #C0398F;

  /* Marka */
  --color-primary:      #6D3BF5;
  --color-primary-deep: #3A1B9B;
  --color-primary-soft: #9B7BFF;

  /* Akcent */
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
  --font-display: var(--font-baloo), "Baloo 2", ui-rounded, system-ui, sans-serif;
  --font-body:    var(--font-nunito), "Nunito", ui-rounded, system-ui, sans-serif;

  /* Promienie */
  --radius-btn:   14px;
  --radius-card:  20px;
  --radius-app:   28px;

  /* Cienie — twarde, blur = 0 */
  --shadow-hard:    0 4px 0 var(--color-primary-deep);
  --shadow-hard-sm: 0 3px 0 rgb(0 0 0 / 0.35);
  --shadow-lift:    0 18px 40px rgb(0 0 0 / 0.35);
}
```

## 2. Klasy bazowe (CSS)

```css
/* Gradient tła */
.arcade-bg {
  background: linear-gradient(135deg, var(--color-bg-1) 0%, var(--color-bg-2) 45%, var(--color-bg-3) 100%);
}

/* Tekstura halftone */
.halftone {
  background-image: radial-gradient(rgb(255 255 255 / 0.5) 1px, transparent 1px);
  background-size: 6px 6px;
  opacity: 0.10;
}

/* Przycisk arcade (zamiennik .btn) */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 56px;
  padding: 1rem 2rem;
  border-radius: var(--radius-btn);
  border: 3px solid rgb(255 255 255 / 0.9);
  background: var(--color-primary);
  color: white;
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 700;
  font-size: 1.125rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: transform 75ms;
  box-shadow: 0 4px 0 var(--color-primary-deep);
}
.btn:hover { filter: brightness(1.1); }
.btn:active {
  transform: translateY(4px);
  box-shadow: none;
}
.btn:disabled {
  opacity: 0.5;
  box-shadow: none;
  pointer-events: none;
}
.btn:focus-visible {
  outline: 3px solid var(--color-mint);
  outline-offset: 2px;
}

/* Ghost button (biały) */
.btn-ghost {
  background: rgb(255 255 255 / 0.9);
  color: var(--color-sheet-ink);
  border-color: rgb(255 255 255 / 0.4);
  box-shadow: 0 3px 0 rgb(0 0 0 / 0.35);
}
.btn-ghost:hover { filter: brightness(0.95); }
.btn-ghost:active {
  transform: translateY(3px);
  box-shadow: none;
}

/* Accent button (per-game color) */
.btn-accent {
  border-color: color-mix(in srgb, var(--accent, white) 80%, white);
  box-shadow: 0 4px 0 color-mix(in srgb, var(--accent, var(--color-primary-deep)) 70%, black);
}

/* Panel frosted glass (zamiennik .card) */
.card {
  background: var(--color-panel);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 2px solid var(--color-stroke);
  border-radius: var(--radius-card);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.25), 0 18px 40px rgb(0 0 0 / 0.35);
  padding: 1.5rem;
}
```

## 3. Fonty (layout.tsx)

```tsx
import { Baloo_2, Nunito, JetBrains_Mono } from "next/font/google";

// Baloo 2, nie Fredoka — patrz DESIGN.md §1 („Dlaczego nie Fredoka").
const baloo = Baloo_2({
  subsets: ["latin", "latin-ext"],
  variable: "--font-baloo",
  weight: ["600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
  display: "swap",
});

// JetBrains Mono zostaje bez zmian
```

## 4. Receptury Tailwind (do użycia w komponentach)

### Przycisk primary
```
font-display uppercase tracking-[0.06em] text-lg font-bold text-white
px-8 py-4 rounded-[--radius-btn]
bg-primary border-[3px] border-white/90
shadow-[0_4px_0_var(--color-primary-deep)]
transition-transform duration-75
hover:brightness-110
active:translate-y-[4px] active:shadow-none
focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint
disabled:opacity-50 disabled:shadow-none
```

### Przycisk ghost
```
bg-white/90 text-sheet-ink border-[3px] border-white/40
shadow-[0_3px_0_rgb(0_0_0/0.35)]
active:translate-y-[3px] active:shadow-none
```

### Panel frosted glass
```
rounded-[--radius-card] bg-panel backdrop-blur-sm
border-2 border-stroke
shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_18px_40px_rgb(0_0_0/0.35)]
p-6
```

### Zakładki teczkowe
- Aktywna: `bg-panel-hi text-mint rounded-t-[16px] border-2 border-b-0 border-stroke`
- Nieaktywna: `bg-black/15 text-ink-muted mt-1`

### Awatar
```
size-24 rounded-full border-[6px] border-white overflow-hidden
shadow-[0_4px_0_rgb(0_0_0/0.35)]
```

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

.arcade-sheet-enter {
  animation: arcade-pop 160ms ease-out;
}
@keyframes arcade-pop {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
```
