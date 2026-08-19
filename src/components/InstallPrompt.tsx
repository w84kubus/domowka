"use client";
import { useEffect, useState, useCallback } from "react";

// Prompt instalacji PWA (UPGRADE.md §B3).
// - Android/Chrome: przechwytuje beforeinstallprompt, pokazuje dyskretny przycisk.
// - iOS Safari: jednorazowa podpowiedź z instrukcją.
// - Standalone: nie pokazuje nic.
// - Odrzucenie zapamiętane na 30 dni.

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 30;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const elapsed = Date.now() - Number(ts);
    return elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* quota exceeded — trudno */
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (navigator as unknown as { standalone: boolean }).standalone === true)
  );
}

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome/.test(ua);
  return isIOS && isSafari;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // W standalone nie pokazuj nic.
    if (isStandalone() || isDismissed()) return;

    // iOS Safari — pokaż instrukcję.
    if (isIOSSafari()) {
      setShowIOSHint(true);
      setVisible(true);
      return;
    }

    // Android/Chrome — przechwycenie beforeinstallprompt.
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") dismiss();
    setDeferredPrompt(null);
    setVisible(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    dismiss();
    setVisible(false);
  }, []);

  if (!visible) return null;

  if (showIOSHint) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm animate-[slideUp_0.3s_ease] rounded-[20px] border-[3px] border-white/40 bg-sheet p-4 text-sheet-ink shadow-[0_18px_40px_rgb(0_0_0/0.35)]">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-lg text-lg font-bold opacity-60 hover:bg-black/10 hover:opacity-100"
          aria-label="Zamknij"
        >
          ✕
        </button>
        <p className="font-display mb-2 pr-8 text-base font-bold uppercase tracking-[0.04em]">
          Zainstaluj Domówkę
        </p>
        <p className="text-sm font-semibold leading-relaxed">
          Kliknij{" "}
          <span className="inline-flex items-center gap-0.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline text-primary"
            >
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </span>{" "}
          <strong>Udostępnij</strong>, a potem <strong>Dodaj do ekranu początkowego</strong>.
        </p>
      </div>
    );
  }

  // Android/Chrome — przycisk instalacji.
  return (
    <div className="fixed bottom-4 right-4 z-40 animate-[slideUp_0.3s_ease]">
      <div className="flex items-center gap-2 rounded-[20px] border-[3px] border-white/40 bg-sheet p-2 pl-4 text-sheet-ink shadow-[0_18px_40px_rgb(0_0_0/0.35)]">
        <span className="text-sm font-bold">Zainstaluj</span>
        <button
          type="button"
          onClick={handleInstall}
          className="font-display rounded-[14px] border-[3px] border-white/60 bg-primary px-3 py-2 text-sm font-bold uppercase tracking-[0.04em] text-white shadow-[0_3px_0_var(--color-primary-deep)] transition-transform duration-75 active:translate-y-[3px] active:shadow-none"
        >
          📲 Dodaj
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex size-9 items-center justify-center rounded-lg text-lg font-bold opacity-60 hover:bg-black/10 hover:opacity-100"
          aria-label="Zamknij"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
