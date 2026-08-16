"use client";

// Wibracja haptyczna (UPGRADE.md §B4): krótki feedback 10–20 ms.
// Z możliwością wyłączenia przez użytkownika (localStorage).

const VIBRATION_KEY = "vibration-enabled";

function isEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(VIBRATION_KEY);
    return stored !== "false";
  } catch {
    return true;
  }
}

export function setVibrationEnabled(enabled: boolean) {
  try {
    localStorage.setItem(VIBRATION_KEY, String(enabled));
  } catch {
    /* quota exceeded */
  }
}

export function getVibrationEnabled(): boolean {
  return isEnabled();
}

/** Krótka wibracja (domyślnie 15 ms). Ignoruje brak wsparcia i wyłączenie przez użytkownika. */
export function vibrate(ms = 15) {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  if (!isEnabled()) return;
  try {
    navigator.vibrate(ms);
  } catch {
    /* niektóre przeglądarki rzucają wyjątek */
  }
}
