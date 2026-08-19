"use client";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { PmSettings } from "./manifest";
import { CATEGORY_SETS } from "./data/categories";

export function PmSettingsPanel({ value, onChange }: GameSettingsProps<PmSettings>) {
  const set = (patch: Partial<PmSettings>) => onChange({ ...value, ...patch });
  const cats = CATEGORY_SETS[value.categorySet]?.categories ?? [];
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker
        label="Zestaw kategorii"
        value={value.categorySet}
        onChange={(v) => set({ categorySet: v as PmSettings["categorySet"], customCategories: undefined })}
        options={Object.entries(CATEGORY_SETS).map(([id, s]) => ({ v: id, l: s.name }))}
      />
      <p className="text-xs text-[var(--color-tekst-drugi)]">{cats.join(" · ")}</p>

      <SegmentPicker
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
        <SegmentPicker
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
        <SegmentPicker
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
      <SegmentPicker
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
      <SegmentPicker
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
