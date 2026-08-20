"use client";
import { useT } from "@/lib/i18n/provider";
import type { GameHostViewProps } from "@/games/view";

interface Pub {
  phase: "pokaz" | "zgadywanie" | "wynik" | "koniec";
  round: number;
  totalRounds: number;
  submitted: string[];
  target?: string;
  players: { uid: string; nick: string; avatar: string; score: number }[];
  results?: { uid: string; hex: string; deltaE: number; accuracy: number }[];
}

// Ekran TV — czytelny z kanapy. W fazie pokazu kolor zajmuje pół ekranu,
// żeby wszyscy patrzyli na TO SAMO źródło zamiast na swoje telefony.
export function OdcienHostView({ publicState }: GameHostViewProps) {
  const t = useT();
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";

  if (pub.phase === "pokaz") {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <p className="font-display text-3xl font-bold uppercase tracking-wide text-ink">
          {t("odcien.memorise")}
        </p>
        <div
          className="h-[46vh] w-full max-w-3xl rounded-[28px] border-[8px] border-white shadow-[0_8px_0_rgb(0_0_0/0.35)]"
          style={{ background: pub.target }}
        />
      </div>
    );
  }

  if (pub.phase === "zgadywanie") {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="font-display text-4xl font-bold uppercase tracking-wide text-ink">
          {t("odcien.rebuild")}
        </p>
        <p className="font-display text-6xl font-bold text-mint">
          {t("odcien.submittedCount", { done: pub.submitted.length, all: pub.players.length })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex items-center gap-5">
        <span className="font-display text-2xl font-bold uppercase tracking-[0.06em] text-ink-muted">
          {t("odcien.target")}
        </span>
        <span
          className="size-24 rounded-[20px] border-[6px] border-white shadow-[0_6px_0_rgb(0_0_0/0.35)]"
          style={{ background: pub.target }}
        />
        <span className="tabular text-2xl font-bold uppercase text-ink">{pub.target}</span>
      </div>

      <ul className="grid w-full max-w-4xl grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
        {(pub.results ?? []).map((r, i) => (
          <li
            key={r.uid}
            className="flex items-center gap-3 rounded-[20px] border-[3px] border-stroke bg-panel px-3 py-2"
          >
            <span className="font-display w-5 flex-none text-center font-bold text-ink-muted">{i + 1}</span>
            <span className="size-12 flex-none rounded-[12px] border-[3px] border-white" style={{ background: r.hex }} />
            <span className="min-w-0 flex-1 truncate font-display text-lg font-bold text-ink">{nickOf(r.uid)}</span>
            <span className="tabular flex-none font-display text-lg font-bold text-mint">{r.accuracy}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
