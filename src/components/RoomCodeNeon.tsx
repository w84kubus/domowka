"use client";
import { useCallback, useState } from "react";
import { vibrate } from "@/hooks/useVibrate";

// Kod pokoju jako neonowy szyld (SPEC §6.3) — element sygnaturowy.
// D4: kliknięcie kopiuje kod do schowka z flash efektem i wibracją.
// Poświata otoczenia (ambient glow) w CSS — radialny gradient za kodem.

export function RoomCodeNeon({
  code,
  size = "3rem",
  accent = "#f5f3ff",
}: {
  code: string;
  size?: string;
  accent?: string;
}) {
  const [copied, setCopied] = useState(false);

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
    <div className="relative flex flex-col items-center">
      {/* Poświata otoczenia — neon odbija się od ściany */}
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl opacity-30 blur-2xl"
        style={{ background: `radial-gradient(ellipse, ${accent}, transparent 70%)` }}
        aria-hidden
      />
      <button
        type="button"
        onClick={copyCode}
        className="neon-code cursor-pointer border-none bg-transparent p-0"
        style={{ fontSize: size, ["--accent" as string]: accent }}
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
        <span className="mt-1 text-xs text-[var(--color-tekst-drugi)] animate-[fadeIn_0.2s_ease]">
          Skopiowano ✓
        </span>
      )}
    </div>
  );
}
