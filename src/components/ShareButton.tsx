"use client";
import { useT } from "@/lib/i18n/provider";
import { Check, Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { vibrate } from "@/hooks/useVibrate";

// G1 (UPGRADE.md §G): navigator.share — dołączenie jednym kliknięciem.
// Na urządzeniach bez Share API kopiuje link do schowka.

export function ShareButton({ code, compact }: { code: string; compact?: boolean }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    const url = `${window.location.origin}/p/${code}`;
    const text = t("lobby.shareText", { code });

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

  // Wariant compact — w rogu przy QR (mockup lobby), pełny — pod QR na innych ekranach.
  if (compact) {
    return (
      <button
        type="button"
        onClick={share}
        className="font-display w-full rounded-[10px] border-2 border-white/40 bg-white/90 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.04em] text-sheet-ink transition-transform duration-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint active:translate-y-[2px]"
      >
        {copied ? (<><Check size={14} strokeWidth={3} className="inline-block align-[-0.15em]" /> {t("common.copied")}</>) : (<><Share2 size={14} strokeWidth={2.5} className="inline-block align-[-0.15em]" /> {t("lobby.share")}</>)}
      </button>
    );
  }

  return (
    <button type="button" onClick={share} className="btn btn-ghost w-full">
      {copied ? <Check size={20} strokeWidth={3} aria-hidden /> : <Share2 size={20} strokeWidth={2.5} aria-hidden />}
      {copied ? t("lobby.shareCopied") : t("lobby.shareRoom")}
    </button>
  );
}
