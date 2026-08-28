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

// ——— Zajętość dołu przez ekran, nie przez komunikat ———
//
// Trwająca gra ma własne sterowanie przy dolnej krawędzi („Przerwij i wróć do
// lobby", „Zakończ grę"). Pasek instalacji jest `fixed bottom-4` i po prostu na nie
// wchodził — zgłoszone przy sprawdzaniu na telefonie.
//
// Rozwiązanie jest tą samą zasadą co wyżej: nie układamy w stos, tylko czekamy.
// Ekran może zgłosić, że zajmuje dół; komunikat wstrzymuje się do czasu, aż ekran
// zniknie. Rdzeń nie wie, KTÓRA to gra ani nawet że to gra — zgłasza się dowolny
// komponent, więc zasada „rdzeń nie zna konkretnej gry" zostaje nienaruszona.
//
// Licznik, nie flaga: dwa ekrany mogą się na chwilę nałożyć przy przejściu (stary
// odmontowuje się po zamontowaniu nowego) i flaga zwolniłaby dół za wcześnie.

let zajetych = 0;

/** Zdarzenie na `window` przy każdej zmianie zajętości dołu. */
export const BOTTOM_CLAIM_EVENT = "domowka:dol-zajety";

/** Czy jakiś ekran zajmuje teraz dolną krawędź? */
export function bottomClaimed(): boolean {
  return zajetych > 0;
}

/**
 * Zgłoś, że ten ekran zajmuje dół. Zwraca funkcję zwalniającą — nadaje się
 * wprost na `return` z `useEffect`.
 */
export function claimBottom(): () => void {
  zajetych += 1;
  window.dispatchEvent(new Event(BOTTOM_CLAIM_EVENT));
  let zwolniony = false;
  return () => {
    if (zwolniony) return; // podwójne wywołanie nie może zejść poniżej zera
    zwolniony = true;
    zajetych -= 1;
    window.dispatchEvent(new Event(BOTTOM_CLAIM_EVENT));
  };
}
