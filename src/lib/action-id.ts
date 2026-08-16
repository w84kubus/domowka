// C2 (UPGRADE.md §C2): unikalny actionId generowany raz przy kliknięciu.
// Serwer odrzuca duplikaty — dwuklik nie może oddać dwóch głosów.

/** Generuje UUID v4 (crypto.randomUUID z fallbackiem). */
export function newActionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback dla starszych przeglądarek.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
