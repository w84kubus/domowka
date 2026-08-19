"use client";
import { useCallback, useState } from "react";
import { vibrate } from "@/hooks/useVibrate";

// Kod pokoju jako klocowate litery arcade (DESIGN.md §0) — element sygnaturowy.
// Kliknięcie kopiuje kod do schowka z feedbackiem i wibracją.

/** Czy na tym tle czytelniejszy jest czarny tekst? (akcenty gier bywają jasne, np. limonka) */
function needsDarkInk(hex: string): boolean {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}

export function RoomCodeNeon({
  code,
  size = "3rem",
  accent,
}: {
  code: string;
  size?: string;
  accent?: string;
}) {
  const [copied, setCopied] = useState(false);
  const darkInk = !!accent && needsDarkInk(accent);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      vibrate(15);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Schowek niedostępny — nie szkodzi
    }
  }, [code]);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={copyCode}
        className="neon-code cursor-pointer border-none bg-transparent p-0 transition-transform duration-75 active:translate-y-[3px]"
        style={{
          fontSize: size,
          ...(accent
            ? {
                ["--color-primary" as string]: accent,
                ...(darkInk
                  ? { ["--code-ink" as string]: "var(--color-frame)", ["--code-shadow" as string]: "none" }
                  : {}),
              }
            : {}),
        }}
        aria-label={`Kod pokoju ${code.split("").join(" ")}. Kliknij, żeby skopiować.`}
        title="Kliknij, żeby skopiować"
      >
        {code.split("").map((ch, i) => (
          <span key={i} aria-hidden>
            {ch}
          </span>
        ))}
      </button>
      {copied && (
        <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-mint animate-[fadeIn_0.2s_ease]">
          Skopiowano ✓
        </span>
      )}
    </div>
  );
}
