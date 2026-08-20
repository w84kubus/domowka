"use client";
import { Gamepad2, Link2, Smartphone } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { Key } from "@/lib/i18n/dict";
// Sekcja „JAK GRAĆ" na landingu (mockup): trzy kroki z numerem w kółku.
const STEPS: { Icon: typeof Smartphone; key: Key }[] = [
  { Icon: Smartphone, key: "landing.step1" },
  { Icon: Link2, key: "landing.step2" },
  { Icon: Gamepad2, key: "landing.step3" },
];

export function HowToPlay() {
  const t = useT();
  return (
    <section className="relative flex w-full max-w-4xl flex-col gap-4">
      <h2 className="font-display text-center text-2xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_3px_0_rgb(0_0_0/0.35)]">
        {t("landing.howTo")}
      </h2>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className="flex flex-col items-center gap-2 rounded-[20px] border-[3px] border-stroke bg-panel px-4 py-5 text-center shadow-[0_4px_0_rgb(0_0_0/0.35)]"
          >
            <span className="font-display flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-sm font-bold text-white">
              {i + 1}
            </span>
            <s.Icon size={38} strokeWidth={2.5} className="text-mint" aria-hidden />
            <span className="text-base font-bold leading-snug text-ink">{t(s.key)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
