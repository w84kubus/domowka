"use client";
import { useT } from "@/lib/i18n/provider";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { StoperSettings } from "./manifest";

export function StoperSettingsPanel({ value, onChange }: GameSettingsProps<StoperSettings>) {
  const t = useT();
  const set = (patch: Partial<StoperSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker
        label={t("set.stoper.mode")}
        value={value.mode}
        onChange={(v) => set({ mode: v as StoperSettings["mode"] })}
        hint={
          value.mode === "cel"
            ? t("hint.stoper.modeTarget")
            : t("hint.stoper.modeGuess")
        }
        options={[
          { v: "cel", l: t("opt.stoper.target") },
          { v: "zgadnij", l: t("opt.stoper.guess") },
        ]}
      />
      {value.mode === "cel" && (
        <>
      <SegmentPicker
        label={t("set.stoper.target")}
        value={value.targetMode}
        onChange={(v) => set({ targetMode: v })}
        options={[
          { v: "losowy", l: t("opt.random") },
          { v: "staly", l: t("opt.fixed") },
        ]}
      />
      {value.targetMode === "losowy" ? (
        <SegmentPicker
          label={t("set.stoper.range")}
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
          label={t("set.stoper.fixed")}
          value={value.fixedTargetMs}
          onChange={(v) => set({ fixedTargetMs: v as number })}
          options={[
            { v: 5000, l: "5,00 s" },
            { v: 10000, l: "10,00 s" },
            { v: 15000, l: "15,00 s" },
          ]}
        />
      )}
        </>
      )}
      <SegmentPicker
        label={t("set.rounds")}
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
      {value.mode === "cel" && (
      <SegmentPicker
        label={t("set.stoper.autoclose")}
        value={value.roundTimeoutMs}
        onChange={(v) => set({ roundTimeoutMs: v as StoperSettings["roundTimeoutMs"] })}
        hint={t("hint.stoper.autoclose")}
        options={[
          { v: 0, l: t("opt.never") },
          { v: 30000, l: "30 s" },
          { v: 60000, l: "60 s" },
          { v: 120000, l: "2 min" },
        ]}
      />
      )}
      <SegmentPicker
        label={t("set.stoper.reveal")}
        value={value.revealMs}
        onChange={(v) => set({ revealMs: v as StoperSettings["revealMs"] })}
        hint={t("hint.stoper.reveal")}
        options={[
          { v: 5000, l: "5 s" },
          { v: 9000, l: "9 s" },
          { v: 15000, l: "15 s" },
          { v: 30000, l: "30 s" },
          { v: 0, l: t("opt.manual") },
        ]}
      />
      {value.mode === "cel" && (
      <SegmentPicker
        label={t("set.stoper.noover")}
        value={value.noOvershoot}
        onChange={(v) => set({ noOvershoot: v as boolean })}
        hint={t("hint.stoper.noover")}
        options={[
          { v: false, l: t("opt.no") },
          { v: true, l: t("opt.yes") },
        ]}
      />
      )}
      <SegmentPicker
        label={t("set.scoring")}
        value={value.scoring}
        onChange={(v) => set({ scoring: v })}
        options={[
          { v: "precyzja", l: t("opt.stoper.precision") },
          { v: "zwyciestwa", l: t("opt.stoper.wins") },
        ]}
      />
    </div>
  );
}
