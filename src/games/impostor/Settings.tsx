"use client";
import { useT } from "@/lib/i18n/provider";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { ImpostorSettings } from "./manifest";

export function ImpostorSettingsPanel({ value, onChange, playerCount }: GameSettingsProps<ImpostorSettings>) {
  const t = useT();
  const set = (patch: Partial<ImpostorSettings>) => onChange({ ...value, ...patch });
  const suggested = playerCount <= 6 ? 1 : playerCount <= 10 ? 2 : 3;
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker label={t("set.imp.count")} value={value.impostorCount} onChange={(v) => set({ impostorCount: v as ImpostorSettings["impostorCount"] })}
        hint={`Sugestia dla ${playerCount} graczy: ${suggested}`}
        options={[{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }]} />
      <SegmentPicker label={t("set.imp.hint")} value={value.hintType} onChange={(v) => set({ hintType: v as ImpostorSettings["hintType"] })}
        options={[
          { v: "BRAK", l: t("opt.none") }, { v: "KATEGORIA", l: t("opt.imp.category") }, { v: "PIERWSZA_LITERA", l: t("opt.imp.firstLetter") },
          { v: "PODPOWIEDZ", l: t("opt.imp.descriptive") }, { v: "SLOWO_POWIAZANE", l: t("opt.imp.related") },
        ]} />
      {value.hintType === "SLOWO_POWIAZANE" && (
        <SegmentPicker label={t("set.imp.knows")} value={value.impostorKnows} onChange={(v) => set({ impostorKnows: v as boolean })}
          hint={t("hint.imp.knows")}
          options={[{ v: true, l: t("opt.yes") }, { v: false, l: t("opt.no") }]} />
      )}
      {value.impostorCount > 1 && (
        <SegmentPicker label={t("set.imp.knoweach")} value={value.impostorsKnow} onChange={(v) => set({ impostorsKnow: v as boolean })}
          options={[{ v: true, l: t("opt.yes") }, { v: false, l: t("opt.no") }]} />
      )}
      <SegmentPicker label={t("set.imp.clueRounds")} value={value.clueRounds} onChange={(v) => set({ clueRounds: v as ImpostorSettings["clueRounds"] })}
        options={[{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }]} />
      <SegmentPicker label={t("set.imp.clues")} value={value.speakMode} onChange={(v) => set({ speakMode: v as ImpostorSettings["speakMode"] })}
        options={[{ v: "tekstowy", l: t("opt.imp.text") }, { v: "na_glos", l: t("opt.imp.aloud") }]} />
      <SegmentPicker label={t("set.imp.discussion")} value={value.discussionMs} onChange={(v) => set({ discussionMs: v as ImpostorSettings["discussionMs"] })}
        options={[{ v: 60000, l: "60 s" }, { v: 90000, l: "90 s" }, { v: 120000, l: "120 s" }, { v: 0, l: "∞" }]} />
      <SegmentPicker label={t("set.imp.postguess")} value={value.postEjectGuess} onChange={(v) => set({ postEjectGuess: v as boolean })}
        options={[{ v: true, l: t("opt.imp.yes30") }, { v: false, l: t("opt.no") }]} />
      <SegmentPicker label={t("set.rounds")} value={value.rounds} onChange={(v) => set({ rounds: v as ImpostorSettings["rounds"] })}
        options={[{ v: 1, l: "1" }, { v: 3, l: "3" }, { v: 5, l: "5" }, { v: 0, l: "∞" }]} />
    </div>
  );
}
