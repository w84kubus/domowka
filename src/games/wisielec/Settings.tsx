"use client";
import type { GameSettingsProps } from "@/games/view";
import type { WisielecSettings } from "./manifest";
import { WORD_SETS } from "./data/words";

function Seg<T extends string | number | boolean>({
  label, options, value, onChange,
}: { label: string; options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-[var(--color-tekst-drugi)]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => onChange(o.v)}
            className={`min-h-[44px] rounded-lg border px-3 text-sm font-semibold transition-colors ${
              value === o.v
                ? "border-[var(--color-bursztyn)] bg-[var(--color-uniesione)] text-[var(--color-tekst)]"
                : "border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] text-[var(--color-tekst-drugi)]"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WisielecSettingsPanel({ value, onChange }: GameSettingsProps<WisielecSettings>) {
  const set = (patch: Partial<WisielecSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <Seg
        label="Tryb"
        value={value.mode}
        onChange={(v) => set({ mode: v as WisielecSettings["mode"] })}
        options={[
          { v: "wyscig", l: "Wyścig" },
          { v: "kooperacja", l: "Kooperacja" },
          { v: "zadajacy", l: "Zadający" },
        ]}
      />
      {value.mode !== "zadajacy" && (
        <Seg
          label="Zestaw haseł"
          value={value.wordSet}
          onChange={(v) => set({ wordSet: v as WisielecSettings["wordSet"] })}
          options={Object.entries(WORD_SETS).map(([id, s]) => ({ v: id, l: s.name }))}
        />
      )}
      <Seg
        label="Życia (elementy wisielca)"
        value={value.lives}
        onChange={(v) => set({ lives: v as WisielecSettings["lives"] })}
        options={[{ v: 6, l: "6" }, { v: 8, l: "8" }, { v: 10, l: "10" }]}
      />
      <Seg
        label="Rundy"
        value={value.rounds}
        onChange={(v) => set({ rounds: v as WisielecSettings["rounds"] })}
        options={[{ v: 3, l: "3" }, { v: 5, l: "5" }, { v: 0, l: "∞" }]}
      />
      <Seg
        label="Ogonki (Ą, Ć, Ę…)"
        value={value.ignoreOgonki}
        onChange={(v) => set({ ignoreOgonki: v as boolean })}
        options={[{ v: false, l: "Osobne litery" }, { v: true, l: "Ignoruj (a=ą)" }]}
      />
      <Seg
        label="Litery Q V X"
        value={value.extraLetters}
        onChange={(v) => set({ extraLetters: v as boolean })}
        options={[{ v: false, l: "Bez" }, { v: true, l: "Z Q V X" }]}
      />
      {value.mode === "zadajacy" && (
        <Seg
          label="Trafienie = kolejna tura"
          value={value.hitContinues}
          onChange={(v) => set({ hitContinues: v as boolean })}
          options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]}
        />
      )}
    </div>
  );
}
