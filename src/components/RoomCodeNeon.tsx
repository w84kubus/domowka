// Kod pokoju jako neonowy szyld (SPEC §6.3) — element sygnaturowy strony.
// accent = kolor akcentu (domyślnie biały w lobby, kolor gry w trakcie gry).

export function RoomCodeNeon({
  code,
  size = "3rem",
  accent = "#f5f3ff",
}: {
  code: string;
  size?: string;
  accent?: string;
}) {
  return (
    <div
      className="neon-code"
      style={{ fontSize: size, ["--accent" as string]: accent }}
      aria-label={`Kod pokoju ${code.split("").join(" ")}`}
    >
      {code.split("").map((ch, i) => (
        <span key={i} aria-hidden>
          {ch}
        </span>
      ))}
    </div>
  );
}
