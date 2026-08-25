// Ilustracja z pakietu „Ekipa" (assets/ASSETS.md). Każdy plik istnieje w dwóch
// rozmiarach — @1x i @2x — więc przeglądarka sama wybiera właściwy przez `srcSet`.
//
// Świadomie zwykły <img>, nie next/image: mamy dokładnie dwa gotowe warianty i znamy
// rozmiary wyświetlania, więc optymalizator nie ma tu nic do policzenia, a `srcSet`
// z dwoma pozycjami załatwia retinę bez requestu do /_next/image.

const DIMS = {
  "postacie/hero-ekipa": [1600, 893],
  "postacie/ziomek-czeka": [655, 720],
  "postacie/ziomek-zagubiony": [636, 720],
  "postacie/ziomek-wygrana": [645, 720],
  "sceny/howto-pokoj": [454, 640],
  "sceny/howto-kod": [640, 493],
  "sceny/howto-gra": [640, 453],
} as const;

export type IllustrationId = keyof typeof DIMS;

export function Illustration({
  id,
  className,
  priority,
  alt = "",
}: {
  id: IllustrationId;
  className?: string;
  /**
   * Ładuj od razu, bez czekania na przewinięcie.
   *
   * Konieczne wszędzie tam, gdzie ilustracja pojawia się dopiero po zmianie stanu
   * (ekran błędu, offline, „nie ma takiego pokoju") — przy `loading="lazy"` obrazek
   * montowany po pierwszym renderze potrafi w ogóle nie wystartować, mimo że leży
   * w widoku, i zostaje po nim pusta dziura. Sprawdzone na ekranie „Nie udało się
   * wejść": `currentSrc` pusty, `complete` false, element widoczny.
   */
  priority?: boolean;
  /** Domyślnie dekoracja (alt=""). Podaj tekst tylko, gdy obrazek NIESIE treść. */
  alt?: string;
}) {
  const [w, h] = DIMS[id];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/assets/${id}@1x.webp`}
      srcSet={`/assets/${id}@1x.webp 1x, /assets/${id}@2x.webp 2x`}
      // Jawne width/height w proporcji oryginału — bez nich layout skacze po dociągnięciu.
      width={w / 2}
      height={h / 2}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
