"use client";

// Arcade segment buttons — jeden rząd klocków zamiast <select> (mockup „USTAWIENIA GRY").
// Wybrany: ciemniejsze tło + limonkowa ramka + hard shadow. Niewybrany: jasny panel.
//
// Typ opcji jest generyczny (string | number | boolean), bo gry trzymają w ustawieniach
// liczby (rundy, ms) i flagi — zawężenie do string wymusiłoby konwersje w 5 miejscach
// i skasowało kontrolę typów na `value`.
export function SegmentPicker<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: { v: T; l: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Podpowiedź pod przełącznikiem (np. sugerowana liczba dla tylu graczy). */
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const selected = value === o.v;
          return (
            <button
              key={String(o.v)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.v)}
              className={`font-display min-h-[44px] rounded-[14px] border-[3px] px-4 text-sm font-bold uppercase tracking-[0.04em] transition-transform duration-75 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-mint focus-visible:outline-offset-2 active:translate-y-[3px] active:shadow-none ${
                selected
                  ? "border-limonka bg-black/25 text-limonka shadow-[0_3px_0_rgb(0_0_0/0.45)]"
                  : "border-stroke bg-panel text-ink-muted shadow-[0_3px_0_rgb(0_0_0/0.35)]"
              }`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-xs font-semibold text-ink-muted">{hint}</p>}
    </div>
  );
}
