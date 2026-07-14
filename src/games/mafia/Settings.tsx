"use client";
import type { GameSettingsProps } from "@/games/view";
import type { MafiaSettings } from "./manifest";
import { autoMafiaCount } from "./manifest";

function Seg<T extends string | number | boolean>({
  label, options, value, onChange, hint,
}: { label: string; options: { v: T; l: string }[]; value: T; onChange: (v: T) => void; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-[var(--color-tekst-drugi)]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={String(o.v)} type="button" onClick={() => onChange(o.v)}
            className={`min-h-[44px] rounded-lg border px-3 text-sm font-semibold transition-colors ${
              value === o.v ? "border-[var(--color-czerwien)] bg-[var(--color-uniesione)] text-[var(--color-tekst)]"
                : "border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] text-[var(--color-tekst-drugi)]"}`}>
            {o.l}
          </button>
        ))}
      </div>
      {hint && <p className="text-xs text-[var(--color-tekst-drugi)]">{hint}</p>}
    </div>
  );
}

export function MafiaSettingsPanel({ value, onChange, playerCount }: GameSettingsProps<MafiaSettings>) {
  const set = (patch: Partial<MafiaSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      {playerCount < 6 && <p className="text-xs text-[var(--color-bursztyn)]">Zalecane min. 6 graczy — przy mniejszej liczbie gra bywa krótka.</p>}
      <Seg label="Liczba mafiozów" value={value.mafiaCount} onChange={(v) => set({ mafiaCount: v as number })}
        hint={`Auto dla ${playerCount} graczy: ${autoMafiaCount(playerCount)}`}
        options={[{ v: 0, l: "Auto" }, { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }, { v: 4, l: "4" }, { v: 5, l: "5" }]} />
      <Seg label="Ujawniać rolę po śmierci" value={value.revealRoles} onChange={(v) => set({ revealRoles: v as boolean })}
        options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]} />
      <Seg label="Czas dyskusji" value={value.discussionMs} onChange={(v) => set({ discussionMs: v as MafiaSettings["discussionMs"] })}
        options={[{ v: 120000, l: "2 min" }, { v: 180000, l: "3 min" }, { v: 300000, l: "5 min" }, { v: 0, l: "∞" }]} />
      <Seg label="Głosowanie" value={value.secretVoting} onChange={(v) => set({ secretVoting: v as boolean })}
        options={[{ v: false, l: "Jawne" }, { v: true, l: "Tajne" }]} />
      <Seg label="Lekarz może ratować siebie" value={value.doctorSelfSave} onChange={(v) => set({ doctorSelfSave: v as boolean })}
        options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]} />
      <Seg label="Lekarz: ta sama osoba 2× z rzędu" value={value.doctorNoRepeat} onChange={(v) => set({ doctorNoRepeat: v as boolean })}
        options={[{ v: true, l: "Nie wolno" }, { v: false, l: "Wolno" }]} />
    </div>
  );
}
