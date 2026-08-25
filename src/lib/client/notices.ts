// Koordynacja pasków przyklejonych do dołu ekranu.
//
// Mamy dwa niezależne komunikaty, które lądują w tym samym miejscu: informacja
// o prywatności (PrivacyNotice) i zachęta do instalacji PWA (InstallPrompt).
// Oba montuje layout, żaden nie wiedział o drugim i na telefonie potrafiły
// wylądować jeden na drugim — zgłoszone z Samsunga S21.
//
// Zasada: JEDEN komunikat naraz. Prywatność ma pierwszeństwo, bo pokazuje się raz
// w życiu i znika po kliknięciu, a instalacja może spokojnie poczekać do następnego
// ekranu. Zderzenie rozwiązujemy kolejnością, nie układaniem pasków w stos —
// dwa banery naraz są złe niezależnie od tego, czy na siebie nachodzą.

/** Klucz w localStorage: użytkownik widział już informację o prywatności. */
export const PRIVACY_SEEN_KEY = "privacy-notice-seen";

/** Zdarzenie na `window` po zamknięciu informacji — zwalnia miejsce na dole. */
export const PRIVACY_DISMISSED_EVENT = "domowka:privacy-dismissed";

/** Czy dół ekranu jest wolny (informacja o prywatności już zamknięta)? */
export function privacyNoticeSeen(): boolean {
  try {
    return localStorage.getItem(PRIVACY_SEEN_KEY) !== null;
  } catch {
    // Prywatne okno bez localStorage — informacja się nie pokaże, więc dół jest wolny.
    return true;
  }
}

/** Zapamiętaj zamknięcie i powiadom resztę aplikacji, że dół się zwolnił. */
export function markPrivacyNoticeSeen(): void {
  try {
    localStorage.setItem(PRIVACY_SEEN_KEY, "1");
  } catch {
    /* nie szkodzi — i tak chowamy na czas tej sesji */
  }
  window.dispatchEvent(new Event(PRIVACY_DISMISSED_EVENT));
}
