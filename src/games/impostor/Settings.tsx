"use client";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { ImpostorSettings } from "./manifest";

export function ImpostorSettingsPanel({ value, onChange, playerCount }: GameSettingsProps<ImpostorSettings>) {
  const set = (patch: Partial<ImpostorSettings>) => onChange({ ...value, ...patch });
  const suggested = playerCount <= 6 ? 1 : playerCount <= 10 ? 2 : 3;
  return (
    <div className="flex flex-col gap-5">
      <SegmentPicker label="Liczba impostorów" value={value.impostorCount} onChange={(v) => set({ impostorCount: v as ImpostorSettings["impostorCount"] })}
        hint={`Sugestia dla ${playerCount} graczy: ${suggested}`}
        options={[{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }]} />
      <SegmentPicker label="Podpowiedź dla impostora" value={value.hintType} onChange={(v) => set({ hintType: v as ImpostorSettings["hintType"] })}
        options={[
          { v: "BRAK", l: "Brak" }, { v: "KATEGORIA", l: "Kategoria" }, { v: "PIERWSZA_LITERA", l: "1. litera" },
          { v: "PODPOWIEDZ", l: "Opisowa" }, { v: "SLOWO_POWIAZANE", l: "Słowo powiązane" },
        ]} />
      {value.hintType === "SLOWO_POWIAZANE" && (
        <SegmentPicker label="Czy impostor wie, że jest impostorem?" value={value.impostorKnows} onChange={(v) => set({ impostorKnows: v as boolean })}
          hint="Wariant NIE: dostaje inne słowo i musi się sam zorientować — najlepszy tryb."
          options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]} />
      )}
      {value.impostorCount > 1 && (
        <SegmentPicker label="Impostorzy się znają" value={value.impostorsKnow} onChange={(v) => set({ impostorsKnow: v as boolean })}
          options={[{ v: true, l: "Tak" }, { v: false, l: "Nie" }]} />
      )}
      <SegmentPicker label="Tury podpowiedzi" value={value.clueRounds} onChange={(v) => set({ clueRounds: v as ImpostorSettings["clueRounds"] })}
        options={[{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }]} />
      <SegmentPicker label="Podpowiedzi" value={value.speakMode} onChange={(v) => set({ speakMode: v as ImpostorSettings["speakMode"] })}
        options={[{ v: "tekstowy", l: "Tekstowo" }, { v: "na_glos", l: "Na głos" }]} />
      <SegmentPicker label="Dyskusja" value={value.discussionMs} onChange={(v) => set({ discussionMs: v as ImpostorSettings["discussionMs"] })}
        options={[{ v: 60000, l: "60 s" }, { v: 90000, l: "90 s" }, { v: 120000, l: "120 s" }, { v: 0, l: "∞" }]} />
      <SegmentPicker label="Zgadywanie po wylocie" value={value.postEjectGuess} onChange={(v) => set({ postEjectGuess: v as boolean })}
        options={[{ v: true, l: "Tak (30 s)" }, { v: false, l: "Nie" }]} />
      <SegmentPicker label="Rundy" value={value.rounds} onChange={(v) => set({ rounds: v as ImpostorSettings["rounds"] })}
        options={[{ v: 1, l: "1" }, { v: 3, l: "3" }, { v: 5, l: "5" }, { v: 0, l: "∞" }]} />
    </div>
  );
}
