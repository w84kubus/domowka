// Awatary graczy (SPEC §4). Wartości to stabilne identyfikatory, nie emoji —
// wygląd (ikona Lucide + kolor kafelka) żyje w src/components/AvatarIcon.tsx.
export const AVATARS = [
  // zwierzęta
  "cat", "dog", "bird", "rabbit", "panda", "squirrel", "fish", "turtle",
  "bug", "rat", "snail", "worm", "shell", "feather", "egg", "paw",
  // przedmioty
  "pizza", "beer", "guitar", "rocket", "bot", "ghost", "skull", "flame",
  "gamepad", "crown", "diamond", "anchor", "bike", "zap",
] as const;

export const DEFAULT_AVATAR: string = AVATARS[0];

// Awatary sprzed przejścia na ikony. Gracze siedzący w pokojach mają je zapisane
// w Firestore — akceptujemy je przy walidacji, żeby nikogo nie wyrzucić w trakcie
// gry. Nie ma ich w AVATARS, więc nie da się ich wybrać na nowo.
const LEGACY_AVATARS = [
  "🦊", "🐼", "🐧", "🦁", "🐸", "🐙", "🦄", "🐝", "🦉", "🐬",
  "🐢", "🦖", "🦩", "🐯", "🐨", "🐰", "🦇", "🦈", "🐳", "🦭",
  "🍕", "🍺", "🎸", "🚀", "👽", "🤖", "👾", "🎃", "💀", "🔥",
];

export function isValidAvatar(a: string): boolean {
  return (AVATARS as readonly string[]).includes(a) || LEGACY_AVATARS.includes(a);
}
