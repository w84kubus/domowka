// Tabela ról Mafii (SPEC §5.6). Osobny moduł, bo to on decyduje o kolejności
// budzenia i o tym, kto w ogóle działa w nocy — silnik tylko go czyta.
//
// Dodanie kolejnej roli = wpis w ROLE_SPECS + pozycja w WAKE_ORDER + obsługa
// jej efektu w potoku rozliczenia. Bez tej tabeli każda nowa rola oznaczałaby
// dopisywanie warunków w kilku miejscach silnika naraz.

export type Role =
  | "mafia"
  | "mieszkaniec"
  | "detektyw"
  | "lekarz"
  | "szeryf"
  | "barman"
  | "snajper"
  | "kamikadze"
  | "zakochani";

export type Faction = "mafia" | "miasto";

export interface RoleSpec {
  id: Role;
  faction: Faction;
  /** Budzi się w nocy i ma co robić. */
  nightAction: boolean;
  /** Zdolność do użycia raz na całą grę, nie co noc. */
  oncePerGame: boolean;
  /** Rola podstawowa — zawsze w rozdaniu. Reszta wchodzi przez ustawienia. */
  core: boolean;
  /** Ilu graczy dostaje tę rolę. Zakochani występują parą, więc 2. */
  slots: number;
}

export const ROLE_SPECS: Record<Role, RoleSpec> = {
  mafia: { id: "mafia", faction: "mafia", nightAction: true, oncePerGame: false, core: true, slots: 1 },
  mieszkaniec: { id: "mieszkaniec", faction: "miasto", nightAction: false, oncePerGame: false, core: true, slots: 1 },
  detektyw: { id: "detektyw", faction: "miasto", nightAction: true, oncePerGame: false, core: true, slots: 1 },
  lekarz: { id: "lekarz", faction: "miasto", nightAction: true, oncePerGame: false, core: true, slots: 1 },
  szeryf: { id: "szeryf", faction: "miasto", nightAction: true, oncePerGame: true, core: false, slots: 1 },
  barman: { id: "barman", faction: "miasto", nightAction: true, oncePerGame: false, core: false, slots: 1 },
  snajper: { id: "snajper", faction: "miasto", nightAction: true, oncePerGame: false, core: false, slots: 1 },
  // Reagują na śmierć, nie budzą się w nocy — dlatego nightAction: false i brak
  // pozycji w WAKE_ORDER. Ich efekt wchodzi dopiero przy świcie.
  kamikadze: { id: "kamikadze", faction: "miasto", nightAction: false, oncePerGame: false, core: false, slots: 1 },
  zakochani: { id: "zakochani", faction: "miasto", nightAction: false, oncePerGame: false, core: false, slots: 2 },
};

/**
 * Kolejność budzenia (SPEC §5.6.2). Zachowane są względne pozycje ze specyfikacji:
 * Barman(4) → Szeryf(5) → Mafia(7) → Snajper(10) → Lekarz(11) → Detektyw(12).
 * Role jeszcze niezaimplementowane po prostu w tej liście nie występują — dopisanie
 * ich później nie zmienia kolejności tych, które już są.
 */
export const WAKE_ORDER: Role[] = ["barman", "szeryf", "mafia", "snajper", "lekarz", "detektyw"];

/** Role, które host może włączyć w ustawieniach (poza podstawowymi). */
export const OPTIONAL_ROLES: Role[] = Object.values(ROLE_SPECS)
  .filter((r) => !r.core)
  .map((r) => r.id);

/**
 * Sąsiad z lewej wg `seatOrder` — używany przez Barmana do przekierowania
 * zabójstwa (SPEC §5.6.2, poz. 4).
 *
 * „Z lewej" liczymy jako POPRZEDNI w kolejności miejsc, z zawinięciem. Przy stole
 * kolejność miejsc biegnie zgodnie z ruchem wskazówek zegara, więc siedzący
 * wcześniej jest po lewej ręce. Pomijamy martwych — przekierowanie na trupa
 * oznaczałoby, że mafia traci noc przez przypadek.
 */
export function neighbourOnSide(
  seatOrder: string[],
  uid: string,
  side: "left" | "right",
  isAlive: (u: string) => boolean,
): string | null {
  const i = seatOrder.indexOf(uid);
  if (i < 0) return null;
  const krok = side === "left" ? -1 : 1;
  const n = seatOrder.length;
  for (let k = 1; k < n; k++) {
    const kandydat = seatOrder[((i + krok * k) % n + n) % n];
    if (kandydat !== uid && isAlive(kandydat)) return kandydat;
  }
  return null;
}

/** Barman zawsze przekierowuje w lewo — strona jest ustalona w SPEC §5.6.2. */
export function leftNeighbour(
  seatOrder: string[],
  uid: string,
  isAlive: (u: string) => boolean,
): string | null {
  return neighbourOnSide(seatOrder, uid, "left", isAlive);
}
