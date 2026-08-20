"use client";
import { SegmentPicker } from "@/components/SegmentPicker";
import { useT } from "@/lib/i18n/provider";
import type { GameSettingsProps } from "@/games/view";
import type { OdcienSettings } from "./manifest";

export function OdcienSettingsPanel({ value, onChange }: GameSettingsProps<OdcienSettings>) {
  const t = useT();
  const set = (patch: Partial<OdcienSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker
        label={t("set.odcien.show")}
        value={value.showMs}
        onChange={(v) => set({ showMs: v as OdcienSettings["showMs"] })}
        options={[
          { v: 3000, l: "3 s" },
          { v: 5000, l: "5 s" },
          { v: 8000, l: "8 s" },
        ]}
      />
      <SegmentPicker
        label={t("set.odcien.space")}
        value={value.space}
        onChange={(v) => set({ space: v as OdcienSettings["space"] })}
        hint={t("hint.odcien.space")}
        options={[
          { v: "rgb", l: "RGB" },
          { v: "hsl", l: "HSL" },
        ]}
      />
      <SegmentPicker
        label={t("set.rounds")}
        value={value.rounds}
        onChange={(v) => set({ rounds: v as OdcienSettings["rounds"] })}
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
        label={t("set.stoper.reveal")}
        value={value.revealMs}
        onChange={(v) => set({ revealMs: v as OdcienSettings["revealMs"] })}
        hint={t("hint.stoper.reveal")}
        options={[
          { v: 5000, l: "5 s" },
          { v: 9000, l: "9 s" },
          { v: 15000, l: "15 s" },
          { v: 0, l: t("opt.manual") },
        ]}
      />
      <SegmentPicker
        label={t("set.scoring")}
        value={value.scoring}
        onChange={(v) => set({ scoring: v as OdcienSettings["scoring"] })}
        options={[
          { v: "precyzja", l: t("opt.odcien.precision") },
          { v: "zwyciestwa", l: t("opt.stoper.wins") },
        ]}
      />
    </div>
  );
}
