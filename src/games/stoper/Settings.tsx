"use client";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { StoperSettings } from "./manifest";

export function StoperSettingsPanel({ value, onChange }: GameSettingsProps<StoperSettings>) {
  const set = (patch: Partial<StoperSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker
        label="Cel"
        value={value.targetMode}
        onChange={(v) => set({ targetMode: v })}
        options={[
          { v: "losowy", l: "Losowy" },
          { v: "staly", l: "Stały" },
        ]}
      />
      {value.targetMode === "losowy" ? (
        <SegmentPicker
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
        <SegmentPicker
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
      <SegmentPicker
        label="Rundy"
        value={value.rounds}
        onChange={(v) => set({ rounds: v as StoperSettings["rounds"] })}
        options={[
          { v: 1, l: "1" },
          { v: 3, l: "3" },
          { v: 5, l: "5" },
          { v: 7, l: "7" },
          { v: 10, l: "10" },
          { v: 0, l: "∞" },
        ]}
      />
      <SegmentPicker
        label="Auto-zamknięcie rundy"
        value={value.roundTimeoutMs}
        onChange={(v) => set({ roundTimeoutMs: v as StoperSettings["roundTimeoutMs"] })}
        hint="Runda domknie się sama, gdy ktoś nie kliknie STOP."
        options={[
          { v: 0, l: "Nigdy" },
          { v: 30000, l: "30 s" },
          { v: 60000, l: "60 s" },
          { v: 120000, l: "2 min" },
        ]}
      />
      <SegmentPicker
        label="Ekran wyników"
        value={value.revealMs}
        onChange={(v) => set({ revealMs: v as StoperSettings["revealMs"] })}
        hint="Ręcznie = wyniki czekają, aż host kliknie Dalej."
        options={[
          { v: 5000, l: "5 s" },
          { v: 9000, l: "9 s" },
          { v: 15000, l: "15 s" },
          { v: 30000, l: "30 s" },
          { v: 0, l: "Ręcznie" },
        ]}
      />
      <SegmentPicker
        label="Bez przekroczenia"
        value={value.noOvershoot}
        onChange={(v) => set({ noOvershoot: v as boolean })}
        hint="Kto przekroczy cel, przepada w tej rundzie."
        options={[
          { v: false, l: "Nie" },
          { v: true, l: "Tak" },
        ]}
      />
      <SegmentPicker
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
