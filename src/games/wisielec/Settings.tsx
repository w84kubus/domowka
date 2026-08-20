"use client";
import { useT } from "@/lib/i18n/provider";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { WisielecSettings } from "./manifest";
import { WORD_SETS } from "./data/words";

export function WisielecSettingsPanel({ value, onChange }: GameSettingsProps<WisielecSettings>) {
  const t = useT();
  const set = (patch: Partial<WisielecSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker
        label={t("set.wis.mode")}
        value={value.mode}
        onChange={(v) => set({ mode: v as WisielecSettings["mode"] })}
        options={[
          { v: "wyscig", l: t("opt.wis.race") },
          { v: "kooperacja", l: t("opt.wis.coop") },
          { v: "zadajacy", l: t("opt.wis.setter") },
        ]}
      />
      {value.mode !== "zadajacy" && (
        <SegmentPicker
          label={t("set.wis.wordset")}
          value={value.wordSet}
          onChange={(v) => set({ wordSet: v as WisielecSettings["wordSet"] })}
          options={Object.entries(WORD_SETS).map(([id, s]) => ({ v: id, l: s.name }))}
        />
      )}
      <SegmentPicker
        label={t("set.wis.lives")}
        value={value.lives}
        onChange={(v) => set({ lives: v as WisielecSettings["lives"] })}
        options={[{ v: 6, l: "6" }, { v: 8, l: "8" }, { v: 10, l: "10" }]}
      />
      <SegmentPicker
        label={t("set.rounds")}
        value={value.rounds}
        onChange={(v) => set({ rounds: v as WisielecSettings["rounds"] })}
        options={[{ v: 3, l: "3" }, { v: 5, l: "5" }, { v: 0, l: "∞" }]}
      />
      <SegmentPicker
        label={t("set.wis.ogonki")}
        value={value.ignoreOgonki}
        onChange={(v) => set({ ignoreOgonki: v as boolean })}
        options={[{ v: false, l: t("opt.wis.separate") }, { v: true, l: t("opt.wis.ignore") }]}
      />
      <SegmentPicker
        label={t("set.wis.qvx")}
        value={value.extraLetters}
        onChange={(v) => set({ extraLetters: v as boolean })}
        options={[{ v: false, l: t("opt.wis.without") }, { v: true, l: t("opt.wis.withQVX") }]}
      />
      {value.mode === "zadajacy" && (
        <SegmentPicker
          label={t("set.wis.hitcont")}
          value={value.hitContinues}
          onChange={(v) => set({ hitContinues: v as boolean })}
          options={[{ v: true, l: t("opt.yes") }, { v: false, l: t("opt.no") }]}
        />
      )}
    </div>
  );
}
