"use client";
import { useEffect } from "react";

// Obsługa visualViewport przy otwartej klawiaturze (UPGRADE.md §B4).
// Na iOS Safari klawiatura przesłania dolną część ekranu. visualViewport API
// pozwala przesunąć treść tak, żeby pole input było widoczne.
// Ustawia CSS custom property --vvh (visual viewport height) na :root,
// którego można użyć zamiast 100dvh w ekranach z inputem.
export function useVisualViewport() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const vv = window.visualViewport;
    const update = () => {
      // Ustaw --vvh na faktyczną wysokość widoczną (bez klawiatury).
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
      // Ustaw --vv-offset na przesunięcie od dołu (jak wysoko jest klawiatura).
      const offset = window.innerHeight - vv.height;
      document.documentElement.style.setProperty("--vv-offset", `${offset}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--vvh");
      document.documentElement.style.removeProperty("--vv-offset");
    };
  }, []);
}
