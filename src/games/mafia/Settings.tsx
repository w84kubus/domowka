"use client";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { MafiaSettings } from "./manifest";
import { autoMafiaCount } from "./manifest";

export function MafiaSettingsPanel({ value, onChange, playerCount }: GameSettingsProps<MafiaSettings>) {
  const set = (patch: Partial<MafiaSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      {playerCount < 6 && (
        <p className="rounded-[14px] border-2 border-bursztyn/50 bg-bursztyn/15 px-3 py-2 text-xs font-bold text-bursztyn">
          Zalecane min. 6 graczy — przy mniejszej liczbie gra bywa krótka.
        </p>
      )}
      <SegmentPicker label="Liczba mafiozów" value={value.mafiaCount} onChange={(v) => set({ mafiaCount: v as number })}
        hint={`Auto dla ${playerCount} graczy: ${autoMafiaCount(playerCount)}`}
        options={[{ v: 0, l: "Auto" }, { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }, { v: 4, l: "4" }, { v: 5, l: "5" }]} />
      <SegmentPicker label="Ujawniać rolę po śmierci" value={value.revealRoles} onChange={(v) => set({ revealRoles: v as boolean })}
        options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]} />
      <SegmentPicker label="Czas dyskusji" value={value.discussionMs} onChange={(v) => set({ discussionMs: v as MafiaSettings["discussionMs"] })}
        options={[{ v: 120000, l: "2 min" }, { v: 180000, l: "3 min" }, { v: 300000, l: "5 min" }, { v: 0, l: "∞" }]} />
      <SegmentPicker label="Głosowanie" value={value.secretVoting} onChange={(v) => set({ secretVoting: v as boolean })}
        options={[{ v: false, l: "Jawne" }, { v: true, l: "Tajne" }]} />
      <SegmentPicker label="Lekarz może ratować siebie" value={value.doctorSelfSave} onChange={(v) => set({ doctorSelfSave: v as boolean })}
        options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]} />
      <SegmentPicker label="Lekarz: ta sama osoba 2× z rzędu" value={value.doctorNoRepeat} onChange={(v) => set({ doctorNoRepeat: v as boolean })}
        options={[{ v: true, l: "Nie wolno" }, { v: false, l: "Wolno" }]} />
    </div>
  );
}
