"use client";
import { AVATARS } from "@/lib/avatars";
import { AvatarIcon, avatarColor } from "@/components/AvatarIcon";

// Siatka awatarów (SPEC §4). Każdy kafelek ma własny kolor tła i ikonę Lucide.
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
      {AVATARS.map((id) => {
        const selected = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Awatar ${id}`}
            onClick={() => onChange(id)}
            // Cień siedzi w gałęzi NIEwybranej, nie w bazie: `.glow-selected` ustawia własny
            // box-shadow (poświatę), a utility z bazy by ją nadpisało i zaznaczenie
            // przestałoby świecić.
            className={`flex aspect-square items-center justify-center rounded-[14px] border-[3px] text-white transition-transform duration-75 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint focus-visible:outline-offset-2 active:translate-y-[3px] active:shadow-none ${
              selected ? "glow-selected" : "border-white/25 shadow-[0_3px_0_rgb(0_0_0/0.35)]"
            }`}
            style={{ background: avatarColor(id) }}
          >
            <AvatarIcon avatar={id} size={40} />
          </button>
        );
      })}
    </div>
  );
}
