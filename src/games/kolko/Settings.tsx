"use client";
import { useT } from "@/lib/i18n/provider";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { KolkoSettings } from "./manifest";

export function KolkoSettingsPanel({ value, onChange, playerCount }: GameSettingsProps<KolkoSettings>) {
  const t = useT();
  const set = (patch: Partial<KolkoSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker label={t("set.kol.rounds")} value={value.rounds}
        onChange={(v) => set({ rounds: v as KolkoSettings["rounds"] })}
        options={[{ v: 3, l: "3" }, { v: 5, l: "5" }, { v: 7, l: "7" }, { v: 0, l: "∞" }]} />
      <SegmentPicker label={t("set.kol.move")} value={value.moveMs}
        onChange={(v) => set({ moveMs: v as KolkoSettings["moveMs"] })}
        options={[{ v: 10000, l: "10 s" }, { v: 20000, l: "20 s" }, { v: 0, l: "∞" }]} />
      {/* Rotacja ma sens dopiero, gdy ktoś czeka — przy dwóch graczach nie ma kogo wymieniać. */}
      {playerCount > 2 && (
        <SegmentPicker label={t("set.kol.stays")} value={value.winnerStays}
          onChange={(v) => set({ winnerStays: v as boolean })}
          options={[{ v: true, l: t("opt.kol.winner") }, { v: false, l: t("opt.kol.rotate") }]} />
      )}
    </div>
  );
}
