// Sekcja „JAK GRAĆ" na landingu (mockup): trzy kroki z numerem w kółku.
const STEPS = [
  { icon: "📱", text: "Załóż pokój na telefonie" },
  { icon: "🔗", text: "Podaj kod znajomym" },
  { icon: "🎮", text: "Wybierz grę i grajcie!" },
];

export function HowToPlay() {
  return (
    <section className="relative flex w-full max-w-4xl flex-col gap-4">
      <h2 className="font-display text-center text-2xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_3px_0_rgb(0_0_0/0.35)]">
        Jak grać
      </h2>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.text}
            className="flex flex-col items-center gap-2 rounded-[20px] border-[3px] border-stroke bg-panel px-4 py-5 text-center shadow-[0_4px_0_rgb(0_0_0/0.35)]"
          >
            <span className="font-display flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="text-4xl" aria-hidden>
              {s.icon}
            </span>
            <span className="text-base font-bold leading-snug text-ink">{s.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
