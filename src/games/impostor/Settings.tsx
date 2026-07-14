"use client";
import type { GameSettingsProps } from "@/games/view";
import type { ImpostorSettings } from "./manifest";

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
              value === o.v ? "border-[var(--color-magenta)] bg-[var(--color-uniesione)] text-[var(--color-tekst)]"
                : "border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] text-[var(--color-tekst-drugi)]"}`}>
            {o.l}
          </button>
        ))}
      </div>
      {hint && <p className="text-xs text-[var(--color-tekst-drugi)]">{hint}</p>}
    </div>
  );
}

export function ImpostorSettingsPanel({ value, onChange, playerCount }: GameSettingsProps<ImpostorSettings>) {
  const set = (patch: Partial<ImpostorSettings>) => onChange({ ...value, ...patch });
  const suggested = playerCount <= 6 ? 1 : playerCount <= 10 ? 2 : 3;
  return (
    <div className="flex flex-col gap-5">
      <Seg label="Liczba impostorów" value={value.impostorCount} onChange={(v) => set({ impostorCount: v as ImpostorSettings["impostorCount"] })}
        hint={`Sugestia dla ${playerCount} graczy: ${suggested}`}
        options={[{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }]} />
      <Seg label="Podpowiedź dla impostora" value={value.hintType} onChange={(v) => set({ hintType: v as ImpostorSettings["hintType"] })}
        options={[
          { v: "BRAK", l: "Brak" }, { v: "KATEGORIA", l: "Kategoria" }, { v: "PIERWSZA_LITERA", l: "1. litera" },
          { v: "PODPOWIEDZ", l: "Opisowa" }, { v: "SLOWO_POWIAZANE", l: "Słowo powiązane" },
        ]} />
      {value.hintType === "SLOWO_POWIAZANE" && (
        <Seg label="Czy impostor wie, że jest impostorem?" value={value.impostorKnows} onChange={(v) => set({ impostorKnows: v as boolean })}
          hint="Wariant NIE: dostaje inne słowo i musi się sam zorientować — najlepszy tryb."
          options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]} />
      )}
      {value.impostorCount > 1 && (
        <Seg label="Impostorzy się znają" value={value.impostorsKnow} onChange={(v) => set({ impostorsKnow: v as boolean })}
          options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]} />
      )}
      <Seg label="Tury podpowiedzi" value={value.clueRounds} onChange={(v) => set({ clueRounds: v as ImpostorSettings["clueRounds"] })}
        options={[{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }]} />
      <Seg label="Podpowiedzi" value={value.speakMode} onChange={(v) => set({ speakMode: v as ImpostorSettings["speakMode"] })}
        options={[{ v: "tekstowy", l: "Tekstowo" }, { v: "na_glos", l: "Na głos" }]} />
      <Seg label="Dyskusja" value={value.discussionMs} onChange={(v) => set({ discussionMs: v as ImpostorSettings["discussionMs"] })}
        options={[{ v: 60000, l: "60 s" }, { v: 90000, l: "90 s" }, { v: 120000, l: "120 s" }, { v: 0, l: "∞" }]} />
      <Seg label="Zgadywanie po wylocie" value={value.postEjectGuess} onChange={(v) => set({ postEjectGuess: v as boolean })}
        options={[{ v: true, l: "Tak (30 s)" }, { v: false, l: "Nie" }]} />
      <Seg label="Rundy" value={value.rounds} onChange={(v) => set({ rounds: v as ImpostorSettings["rounds"] })}
        options={[{ v: 1, l: "1" }, { v: 3, l: "3" }, { v: 5, l: "5" }, { v: 0, l: "∞" }]} />
    </div>
  );
}
