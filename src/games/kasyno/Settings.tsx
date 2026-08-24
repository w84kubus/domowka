"use client";
import { SegmentPicker } from "@/components/SegmentPicker";
import { useT } from "@/lib/i18n/provider";
import type { GameSettingsProps } from "@/games/view";
import type { KasynoSettings } from "./manifest";

export function KasynoSettingsPanel({ value, onChange }: GameSettingsProps<KasynoSettings>) {
  const t = useT();
  const set = (patch: Partial<KasynoSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker
        label={t("set.kasyno.mode")}
        value={value.mode}
        onChange={(v) => set({ mode: v as KasynoSettings["mode"] })}
        hint={t(`hint.kasyno.${value.mode}` as Parameters<typeof t>[0])}
        options={[
          { v: "jackpot", l: t("opt.kasyno.jackpot") },
          { v: "double", l: "Double" },
          { v: "wheel", l: "Wheel" },
          { v: "sloty", l: t("opt.kasyno.sloty") },
        ]}
      />
      <SegmentPicker
        label={t("set.kasyno.start")}
        value={value.startChips}
        onChange={(v) => set({ startChips: v as KasynoSettings["startChips"] })}
        options={[{ v: 500, l: "500" }, { v: 1000, l: "1000" }, { v: 2000, l: "2000" }]}
      />
      <SegmentPicker
        label={t("set.kasyno.betTime")}
        value={value.betMs}
        onChange={(v) => set({ betMs: v as KasynoSettings["betMs"] })}
        options={[{ v: 15000, l: "15 s" }, { v: 20000, l: "20 s" }, { v: 30000, l: "30 s" }]}
      />
      <SegmentPicker
        label={t("set.kasyno.minBet")}
        value={value.minBet}
        onChange={(v) => set({ minBet: v as KasynoSettings["minBet"] })}
        options={[{ v: 5, l: "5" }, { v: 10, l: "10" }, { v: 25, l: "25" }]}
      />
      <SegmentPicker
        label={t("set.kasyno.ante")}
        value={value.ante}
        onChange={(v) => set({ ante: v as KasynoSettings["ante"] })}
        hint={t("hint.kasyno.ante")}
        options={[{ v: 0, l: t("opt.none") }, { v: 10, l: "10" }, { v: 25, l: "25" }]}
      />
    </div>
  );
}
