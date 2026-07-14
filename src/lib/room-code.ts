// Kod pokoju: 4 znaki (SPEC §4). Alfabet bez I, O, 0, 1 — mylą się przy dyktowaniu.
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 4;

/** Generuje losowy kod. rng domyślnie Math.random — to NIE jest silnik gry, tu losowość jest OK. */
export function generateRoomCode(rng: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(rng() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Normalizuje wpisany kod: wielkie litery, tylko dozwolone znaki. */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((ch) => ROOM_CODE_ALPHABET.includes(ch))
    .join("")
    .slice(0, ROOM_CODE_LENGTH);
}

export function isValidRoomCode(input: string): boolean {
  return (
    input.length === ROOM_CODE_LENGTH &&
    input.split("").every((ch) => ROOM_CODE_ALPHABET.includes(ch))
  );
}
