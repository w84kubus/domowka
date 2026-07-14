"use client";
import type { GameSettingsProps } from "@/games/view";
import type { PmSettings } from "./manifest";
import { CATEGORY_SETS } from "./data/categories";

function Seg<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: T; l: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
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
                ? "border-[var(--color-cyjan)] bg-[var(--color-uniesione)] text-[var(--color-tekst)]"
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

export function PmSettingsPanel({ value, onChange }: GameSettingsProps<PmSettings>) {
  const set = (patch: Partial<PmSettings>) => onChange({ ...value, ...patch });
  const cats = CATEGORY_SETS[value.categorySet]?.categories ?? [];
  return (
    <div className="flex flex-col gap-5">
      <Seg
        label="Zestaw kategorii"
        value={value.categorySet}
        onChange={(v) => set({ categorySet: v as PmSettings["categorySet"], customCategories: undefined })}
        options={Object.entries(CATEGORY_SETS).map(([id, s]) => ({ v: id, l: s.name }))}
      />
      <p className="text-xs text-[var(--color-tekst-drugi)]">{cats.join(" · ")}</p>

      <Seg
        label="Koniec rundy"
        value={value.endMode}
        onChange={(v) => set({ endMode: v as PmSettings["endMode"] })}
        options={[
          { v: "stop", l: "STOP (pierwszy)" },
          { v: "czas", l: "Na czas" },
          { v: "recznie", l: "Ręcznie (host)" },
        ]}
      />
      {value.endMode === "czas" && (
        <Seg
          label="Czas"
          value={value.timeLimitMs}
          onChange={(v) => set({ timeLimitMs: v as PmSettings["timeLimitMs"] })}
          options={[
            { v: 60000, l: "60 s" },
            { v: 90000, l: "90 s" },
            { v: 120000, l: "120 s" },
            { v: 180000, l: "180 s" },
          ]}
        />
      )}
      {value.endMode === "stop" && (
        <Seg
          label="Doliczka po STOP"
          value={value.graceMs}
          onChange={(v) => set({ graceMs: v as PmSettings["graceMs"] })}
          options={[
            { v: 5000, l: "5 s" },
            { v: 10000, l: "10 s" },
            { v: 15000, l: "15 s" },
          ]}
        />
      )}
      <Seg
        label="Rundy"
        value={value.rounds}
        onChange={(v) => set({ rounds: v as PmSettings["rounds"] })}
        options={[
          { v: 3, l: "3" },
          { v: 5, l: "5" },
          { v: 8, l: "8" },
          { v: 0, l: "∞" },
        ]}
      />
      <Seg
        label="Tryb hardcore (litery z ogonkami)"
        value={value.hardcore}
        onChange={(v) => set({ hardcore: v as boolean })}
        options={[
          { v: false, l: "Nie" },
          { v: true, l: "Tak (Ą Ć Ę Ł…)" },
        ]}
      />
    </div>
  );
}
