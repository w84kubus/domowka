"use client";
import { useT } from "@/lib/i18n/provider";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { PmSettings } from "./manifest";
import { CATEGORY_SETS } from "./data/categories";

export function PmSettingsPanel({ value, onChange }: GameSettingsProps<PmSettings>) {
  const t = useT();
  const set = (patch: Partial<PmSettings>) => onChange({ ...value, ...patch });
  const cats = CATEGORY_SETS[value.categorySet]?.categories ?? [];
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker
        label={t("set.pm.catset")}
        value={value.categorySet}
        onChange={(v) => set({ categorySet: v as PmSettings["categorySet"], customCategories: undefined })}
        options={Object.entries(CATEGORY_SETS).map(([id, s]) => ({ v: id, l: s.name }))}
      />
      <p className="text-xs font-semibold text-ink-muted">{cats.join(" · ")}</p>

      <SegmentPicker
        label={t("set.pm.endmode")}
        value={value.endMode}
        onChange={(v) => set({ endMode: v as PmSettings["endMode"] })}
        options={[
          { v: "stop", l: t("opt.pm.stopFirst") },
          { v: "czas", l: t("opt.pm.timed") },
          { v: "recznie", l: t("opt.pm.manualHost") },
        ]}
      />
      {value.endMode === "czas" && (
        <SegmentPicker
          label={t("set.pm.time")}
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
          label={t("set.pm.grace")}
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
        label={t("set.rounds")}
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
        label={t("set.pm.hardcore")}
        value={value.hardcore}
        onChange={(v) => set({ hardcore: v as boolean })}
        options={[
          { v: false, l: t("opt.no") },
          { v: true, l: t("opt.pm.hardcoreYes") },
        ]}
      />
    </div>
  );
}
