"use client";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { WisielecSettings } from "./manifest";
import { WORD_SETS } from "./data/words";

export function WisielecSettingsPanel({ value, onChange }: GameSettingsProps<WisielecSettings>) {
  const set = (patch: Partial<WisielecSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker
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
        <SegmentPicker
          label="Zestaw haseł"
          value={value.wordSet}
          onChange={(v) => set({ wordSet: v as WisielecSettings["wordSet"] })}
          options={Object.entries(WORD_SETS).map(([id, s]) => ({ v: id, l: s.name }))}
        />
      )}
      <SegmentPicker
        label="Życia (elementy wisielca)"
        value={value.lives}
        onChange={(v) => set({ lives: v as WisielecSettings["lives"] })}
        options={[{ v: 6, l: "6" }, { v: 8, l: "8" }, { v: 10, l: "10" }]}
      />
      <SegmentPicker
        label="Rundy"
        value={value.rounds}
        onChange={(v) => set({ rounds: v as WisielecSettings["rounds"] })}
        options={[{ v: 3, l: "3" }, { v: 5, l: "5" }, { v: 0, l: "∞" }]}
      />
      <SegmentPicker
        label="Ogonki (Ą, Ć, Ę…)"
        value={value.ignoreOgonki}
        onChange={(v) => set({ ignoreOgonki: v as boolean })}
        options={[{ v: false, l: "Osobne litery" }, { v: true, l: "Ignoruj (a=ą)" }]}
      />
      <SegmentPicker
        label="Litery Q V X"
        value={value.extraLetters}
        onChange={(v) => set({ extraLetters: v as boolean })}
        options={[{ v: false, l: "Bez" }, { v: true, l: "Z Q V X" }]}
      />
      {value.mode === "zadajacy" && (
        <SegmentPicker
          label="Trafienie = kolejna tura"
          value={value.hitContinues}
          onChange={(v) => set({ hitContinues: v as boolean })}
          options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]}
        />
      )}
    </div>
  );
}
