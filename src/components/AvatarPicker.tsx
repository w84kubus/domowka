"use client";
import { AVATARS } from "@/lib/avatars";

// Siatka emoji-awatarów (SPEC §4).
export function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (avatar: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Wybierz awatar">
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
            className={`flex aspect-square items-center justify-center rounded-xl border text-2xl transition-transform active:scale-95 ${
              selected
                ? "border-[var(--color-cyjan)] bg-[var(--color-uniesione)]"
                : "border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)]"
            }`}
            style={selected ? { boxShadow: "0 0 16px rgba(34,211,238,0.35)" } : undefined}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
