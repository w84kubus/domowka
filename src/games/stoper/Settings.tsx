"use client";
import type { GameSettingsProps } from "@/games/view";
import type { StoperSettings } from "./manifest";

function Seg<T extends string | number>({
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
                ? "border-[var(--color-limonka)] bg-[var(--color-uniesione)] text-[var(--color-tekst)]"
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

export function StoperSettingsPanel({ value, onChange }: GameSettingsProps<StoperSettings>) {
  const set = (patch: Partial<StoperSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <Seg
        label="Cel"
        value={value.targetMode}
        onChange={(v) => set({ targetMode: v })}
        options={[
          { v: "losowy", l: "Losowy" },
          { v: "staly", l: "Stały" },
        ]}
      />
      {value.targetMode === "losowy" ? (
        <Seg
          label="Zakres celu (max)"
          value={value.targetMaxMs}
          onChange={(v) => set({ targetMaxMs: v as StoperSettings["targetMaxMs"] })}
          options={[
            { v: 10000, l: "10 s" },
            { v: 30000, l: "30 s" },
            { v: 60000, l: "60 s" },
            { v: 120000, l: "120 s" },
          ]}
        />
      ) : (
        <Seg
          label="Stały cel"
          value={value.fixedTargetMs}
          onChange={(v) => set({ fixedTargetMs: v as number })}
          options={[
            { v: 5000, l: "5,00 s" },
            { v: 10000, l: "10,00 s" },
            { v: 15000, l: "15,00 s" },
          ]}
        />
      )}
      <Seg
        label="Rundy"
        value={value.rounds}
        onChange={(v) => set({ rounds: v as StoperSettings["rounds"] })}
        options={[
          { v: 3, l: "3" },
          { v: 5, l: "5" },
          { v: 7, l: "7" },
          { v: 0, l: "∞" },
        ]}
      />
      <Seg
        label="Punktacja"
        value={value.scoring}
        onChange={(v) => set({ scoring: v })}
        options={[
          { v: "precyzja", l: "Precyzja (10/7/5)" },
          { v: "zwyciestwa", l: "Zwycięstwa (+1)" },
        ]}
      />
    </div>
  );
}
