"use client";
import { useCallback, useState } from "react";
import { vibrate } from "@/hooks/useVibrate";

// G1 (UPGRADE.md §G): navigator.share — dołączenie jednym kliknięciem.
// Na urządzeniach bez Share API kopiuje link do schowka.

export function ShareButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    const url = `${window.location.origin}/p/${code}`;
    const text = `Dołącz do gry! Kod pokoju: ${code}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Domówka", text, url });
        vibrate(15);
        return;
      } catch {
        // użytkownik anulował — fallback do kopiowania
      }
    }

    // Fallback: kopiuj link
    try {
      await navigator.clipboard.writeText(url);
      vibrate(15);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // schowek niedostępny
    }
  }, [code]);

  return (
    <button
      type="button"
      onClick={share}
      className="btn w-full gap-2"
    >
      <span aria-hidden>📤</span>
      {copied ? "Skopiowano link ✓" : "Udostępnij pokój"}
    </button>
  );
}
