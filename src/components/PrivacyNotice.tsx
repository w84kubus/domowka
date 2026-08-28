"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import { BOTTOM_CLAIM_EVENT, bottomClaimed, markPrivacyNoticeSeen, privacyNoticeSeen } from "@/lib/client/notices";

// Informacja przy pierwszej wizycie — NIE baner zgody. Aplikacja nie ma analityki ani
// trackerów, więc nie ma czego odrzucać; RODO wymaga tu poinformowania, nie pytania o zgodę.
// Dlatego nie blokuje ekranu i nie ma przycisku „Odrzuć”, który i tak nic by nie robił.
//
// Gdyby kiedyś doszła analityka — to przestaje wystarczać i trzeba PRAWDZIWEJ zgody
// z realną możliwością odmowy PRZED załadowaniem skryptów.
export function PrivacyNotice() {
  const t = useT();
  const [show, setShow] = useState(false);

  // Informacja czeka, gdy dół ekranu należy do sterowania grą (patrz lib/client/notices).
  // Tylko ODKŁADAMY wyświetlenie — nie oznaczamy jej jako zobaczonej, więc pokaże się
  // po powrocie do lobby. Inaczej gracz, który dołączył w trakcie rundy, nigdy by jej
  // nie zobaczył.
  useEffect(() => {
    const przelicz = () => setShow(!privacyNoticeSeen() && !bottomClaimed());
    przelicz();
    window.addEventListener(BOTTOM_CLAIM_EVENT, przelicz);
    return () => window.removeEventListener(BOTTOM_CLAIM_EVENT, przelicz);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    // Zwalnia też dół ekranu dla zachęty do instalacji (patrz lib/client/notices).
    markPrivacyNoticeSeen();
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label={t("privacy.noticeTitle")}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="card arcade-pop flex w-full max-w-2xl items-center gap-3 py-3">
        <p className="flex-1 text-sm font-semibold leading-snug text-ink-muted">
          {t("privacy.notice")}{" "}
          <Link href="/prywatnosc" className="font-bold text-mint underline underline-offset-2">
            {t("privacy.learnMore")}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("common.close")}
          className="flex size-10 flex-none items-center justify-center rounded-[12px] border-2 border-stroke bg-panel-hi text-ink transition-transform duration-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint active:translate-y-[2px]"
        >
          <X size={18} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}
