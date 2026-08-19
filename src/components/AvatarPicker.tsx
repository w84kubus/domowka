"use client";
import { AVATARS } from "@/lib/avatars";

// Kolor kafelka dopasowany do emoji (mockup „Nowy pokój": każdy awatar ma własne tło).
// Mapa żyje tutaj, a nie w lib/avatars.ts — tam jest lista domenowa, tu wygląd.
const TILE: Record<string, string> = {
  "🦊": "#E8833A", "🐼": "#5B6B7A", "🐧": "#3D5A80", "🦁": "#E0A02E", "🐸": "#6FBF4A",
  "🐙": "#D9648C", "🦄": "#C77DD6", "🐝": "#E4B429", "🦉": "#8B6F47", "🐬": "#3FA9D9",
  "🐢": "#5FA35A", "🦖": "#6BA84F", "🦩": "#F08CA8", "🐯": "#E09428", "🐨": "#7D8A94",
  "🐰": "#C9A9A0", "🦇": "#6A5A7A", "🦈": "#5C8CA8", "🐳": "#3E86BF", "🦭": "#7A8B99",
  "🍕": "#D4762E", "🍺": "#D9A32B", "🎸": "#B5443C", "🚀": "#8A6FD1", "👽": "#6BA86B",
  "🤖": "#6E8CA0", "👾": "#8E6BC7", "🎃": "#E07B26", "💀": "#8A8F99", "🔥": "#E05C2E",
};

// Siatka emoji-awatarów (SPEC §4).
export function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (avatar: string) => void;
}) {
  return (
    <div
      className="grid grid-cols-5 gap-2 sm:grid-cols-6"
      role="radiogroup"
      aria-label="Wybierz awatar"
    >
      {AVATARS.map((emoji) => {
        const selected = emoji === value;
        return (
          <button
            key={emoji}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Awatar ${emoji}`}
            onClick={() => onChange(emoji)}
            className={`flex aspect-square items-center justify-center rounded-[14px] border-[3px] text-2xl shadow-[0_3px_0_rgb(0_0_0/0.35)] transition-transform duration-75 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint focus-visible:outline-offset-2 active:translate-y-[3px] active:shadow-none ${
              selected ? "glow-selected" : "border-white/25"
            }`}
            style={{ background: TILE[emoji] ?? "var(--color-panel-hi)" }}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
