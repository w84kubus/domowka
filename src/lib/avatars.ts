// Siatka awatarów-emoji do wyboru przy wejściu (SPEC §4, ~30 emoji).
export const AVATARS = [
  "🦊", "🐼", "🐧", "🦁", "🐸", "🐙", "🦄", "🐝", "🦉", "🐬",
  "🐢", "🦖", "🦩", "🐯", "🐨", "🐰", "🦇", "🦈", "🐳", "🦭",
  "🍕", "🍺", "🎸", "🚀", "👽", "🤖", "👾", "🎃", "💀", "🔥",
];

export const DEFAULT_AVATAR = AVATARS[0];

export function isValidAvatar(a: string): boolean {
  return AVATARS.includes(a);
}
