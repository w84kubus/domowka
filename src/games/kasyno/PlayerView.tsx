"use client";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { vibrate } from "@/hooks/useVibrate";
import { AvatarIcon } from "@/components/AvatarIcon";
import { Podium } from "@/components/game/Podium";
import type { GameViewProps } from "@/games/view";
import { SpinStrip, type StripItem } from "./SpinStrip";
import { Historia } from "./Historia";
import { SlotMachine } from "./SlotMachine";
import { doubleColourOf, DOUBLE_SLOTS, SLOT_SYMBOLS, SPIN_MS, WHEEL_SEGMENTS } from "./tables";

type Mode = "jackpot" | "double" | "wheel" | "sloty";

interface PlayerRow { uid: string; nick: string; avatar: string; chips: number; out: boolean }
interface BetRow { uid: string; amount: number; pick: string | null }

interface Pub {
  mode: Mode;
  phase: "zaklady" | "losowanie" | "wynik" | "gra" | "koniec";
  round: number;
  minBet: number;
  ante: number;
  bets: BetRow[];
  pot: number;
  outcome: { number?: number; colour?: string; multiplier?: number; winnerUid?: string; reels?: Record<string, string[]> } | null;
  delta: Record<string, number>;
  history: string[];
  winnerUid: string | null;
  lastSpin?: Record<string, { reels: string[]; bet: number; win: number }>;
  players: PlayerRow[];
}

const COLOUR_BG: Record<string, string> = { red: "#C0392B", black: "#1F2430", green: "#1E9E5A" };
const SYMBOL_LABEL: Record<string, string> = {
  cherry: "🍒", lemon: "🍋", bell: "🔔", star: "⭐", gem: "💎", seven: "7",
};

/** Odświeża co pół sekundy, żeby licznik faktycznie tykał. */
function useTicker(ms = 500) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

const secLeft = (endsAt: number | null, now: number) =>
  endsAt == null ? null : Math.max(0, Math.ceil((endsAt - now) / 1000));

export function KasynoPlayerView({ room, publicState, privateState, meUid, isHost, dispatch, serverNow }: GameViewProps) {
  const t = useT();
  const pub = publicState as Pub;
  const priv = privateState as { chips: number; bet: { amount: number; pick?: string } | null; out: boolean } | null;

  const me = pub.players.find((p) => p.uid === meUid);
  const saldo = priv?.chips ?? me?.chips ?? 0;
  const mojZaklad = pub.bets.find((b) => b.uid === meUid) ?? null;
  const odpadl = me?.out ?? false;

  useTicker();
  const now = serverNow();
  const zostalo = secLeft(room.phaseEndsAt, now);
  // Ile animacji już minęło wg serwera — patrz SpinStrip.
  const spinElapsed = room.phaseStartedAt != null ? Math.max(0, now - room.phaseStartedAt) : 0;

  const [stawka, setStawka] = useState(pub.minBet);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [kreci, setKreci] = useState(false);

  useEffect(() => {
    setStawka(Math.min(Math.max(pub.minBet, 0), Math.max(saldo, 0)));
    setPick(null);
    setBusy(false);
    // Nowa runda — czyścimy wybór, żeby nikt nie postawił przypadkiem tego samego co poprzednio.
  }, [pub.round]); // eslint-disable-line react-hooks/exhaustive-deps

  // `busy` znaczy „czekam na potwierdzenie zakładu z serwera" i wygasa, gdy zakładu
  // już nie ma. Bez tego po wycofaniu zakładu przycisk zostawał wyłączony do końca
  // rundy — interfejs wracał do obstawiania, ale nie dało się obstawić ponownie.
  useEffect(() => {
    if (!mojZaklad) setBusy(false);
  }, [mojZaklad]);

  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";

  const wymagaWyboru = pub.mode === "double" || pub.mode === "wheel";
  const mozeObstawic = !odpadl && !mojZaklad && saldo > 0 && (!wymagaWyboru || pick !== null);

  const obstaw = async () => {
    setBusy(true);
    vibrate(15);
    try {
      await dispatch({ type: "BET", amount: Math.min(stawka, saldo), pick: pick ?? undefined });
    } catch {
      setBusy(false);
    }
  };

  // ——— pasek losowania: te same dane, inne kafelki per tryb ———
  const { items, targetIndex } = useMemo((): { items: StripItem[]; targetIndex: number } => {
    if (pub.mode === "double") {
      const items = Array.from({ length: DOUBLE_SLOTS }, (_, n) => ({
        key: String(n),
        bg: COLOUR_BG[doubleColourOf(n)],
        node: <span className="font-display text-xl font-bold text-white">{n}</span>,
      }));
      return { items, targetIndex: pub.outcome?.number ?? 0 };
    }
    if (pub.mode === "wheel") {
      const kolor: Record<number, string> = { 2: "#3B5BDB", 3: "#2F9E44", 4: "#9C36B5", 35: "#B8860B" };
      const items = WHEEL_SEGMENTS.map((s) => ({
        key: String(s.multiplier),
        bg: kolor[s.multiplier],
        node: <span className="font-display text-xl font-bold text-white">×{s.multiplier}</span>,
      }));
      const i = WHEEL_SEGMENTS.findIndex((s) => s.multiplier === pub.outcome?.multiplier);
      return { items, targetIndex: Math.max(0, i) };
    }
    // jackpot — kafelki ważone wkładem, żeby pasek wizualnie oddawał szanse
    const wpisy: StripItem[] = [];
    let cel = 0;
    for (const b of pub.bets) {
      const gracz = pub.players.find((p) => p.uid === b.uid);
      const ile = Math.max(1, Math.round((b.amount / Math.max(pub.pot, 1)) * 20));
      for (let k = 0; k < ile; k++) {
        if (b.uid === pub.outcome?.winnerUid && cel === 0) cel = wpisy.length;
        wpisy.push({
          key: `${b.uid}-${k}`,
          bg: "rgb(255 255 255 / 0.10)",
          node: <AvatarIcon avatar={gracz?.avatar ?? ""} size={38} />,
        });
      }
    }
    return { items: wpisy.length ? wpisy : [{ key: "x", node: null }], targetIndex: cel };
  }, [pub.mode, pub.outcome, pub.bets, pub.players, pub.pot]);

  // ——— SLOTY: własna maszyna, każdy kręci kiedy chce ———
  if (pub.phase === "gra") {
    const mojObrot = pub.lastSpin?.[meUid] ?? null;
    const maxStawka = Math.max(saldo, pub.minBet);

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full max-w-md items-center justify-between gap-3">
          <span className="font-display rounded-[12px] border-2 border-stroke bg-panel px-3 py-1.5 text-sm font-bold text-ink">
            {t("kasyno.balance")}: <span className="tabular text-bursztyn">{saldo}</span>
          </span>
          {pub.ante > 0 && zostalo != null && (
            <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
              {t("kasyno.anteIn", { ante: pub.ante, sec: zostalo })}
            </span>
          )}
        </div>

        <SlotMachine reels={mojObrot?.reels ?? null} spinning={kreci} onSettled={() => setKreci(false)} />

        {mojObrot && !kreci && (
          <p className={`font-display text-lg font-bold uppercase ${mojObrot.win > 0 ? "text-mint" : "text-ink-muted"}`}>
            {mojObrot.win > 0 ? `+${mojObrot.win}` : `−${mojObrot.bet}`}
          </p>
        )}

        {odpadl ? (
          <p className="font-display rounded-[14px] border-[3px] border-czerwien/60 bg-czerwien/15 px-4 py-3 text-center text-base font-bold uppercase text-czerwien">
            {t("kasyno.out")}
          </p>
        ) : (
          <div className="flex w-full max-w-md flex-col gap-3">
            <label className="flex items-center gap-3">
              <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
                {t("kasyno.amount")}
              </span>
              <input
                type="range"
                min={Math.min(pub.minBet, saldo)}
                max={maxStawka}
                step={5}
                value={Math.min(stawka, maxStawka)}
                disabled={kreci}
                onChange={(e) => setStawka(Number(e.target.value))}
                className="odcien-slider flex-1"
                style={{ ["--track" as string]: "linear-gradient(to right,#3A1B9B,#F0B429)" }}
                aria-label={t("kasyno.amount")}
              />
              <span className="tabular w-14 flex-none text-right font-bold text-bursztyn">
                {Math.min(stawka, maxStawka)}
              </span>
            </label>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1 text-sm" disabled={kreci} onClick={() => setStawka(saldo)}>
                {t("kasyno.allIn")}
              </button>
              <button
                type="button"
                className="btn flex-[2]"
                disabled={kreci || saldo <= 0}
                onClick={async () => {
                  setKreci(true);
                  vibrate(15);
                  try {
                    await dispatch({ type: "SPIN", amount: Math.min(stawka, saldo) });
                  } catch {
                    setKreci(false);
                  }
                }}
              >
                {kreci ? t("kasyno.spinning") : t("kasyno.spin")}
              </button>
            </div>
          </div>
        )}

        {/* Salda i ostatnie obroty wszystkich — widać, komu idzie */}
        <section className="flex w-full max-w-md flex-col gap-1">
          <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
            {t("kasyno.others")}
          </span>
          {[...pub.players].sort((a, b) => b.chips - a.chips).map((p) => {
            const obrot = pub.lastSpin?.[p.uid];
            const pokazWynik = p.uid !== meUid || !kreci;
            return (
              <div
                key={p.uid}
                className={`flex items-center gap-2 rounded-[12px] border-2 px-2 py-1.5 ${
                  p.uid === meUid ? "border-mint bg-panel-hi" : "border-stroke bg-panel"
                } ${p.out ? "opacity-40" : ""}`}
              >
                <AvatarIcon avatar={p.avatar} size={22} />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                  {p.nick}
                  {p.uid === meUid && <span className="font-semibold text-ink-muted"> {t("common.you")}</span>}
                </span>
                {/* Własny wynik pokazujemy dopiero, gdy bębny staną. Bez tego lista
                    na dole zdradzała symbole i wygraną, zanim animacja się skończyła —
                    czyli cała maszyna kręciła się już po ogłoszonym wyniku.
                    Cudze obroty pokazujemy od razu: ich animacji i tak nie oglądam. */}
                {obrot && pokazWynik && (
                  <span className="flex gap-0.5 text-base" aria-hidden>
                    {obrot.reels.map((r, i) => (
                      <span key={i}>{SYMBOL_LABEL[r] ?? r}</span>
                    ))}
                  </span>
                )}
                {obrot && pokazWynik && (
                  <span className={`tabular w-12 text-right text-xs font-bold ${obrot.win > 0 ? "text-mint" : "text-czerwien"}`}>
                    {obrot.win > 0 ? `+${obrot.win}` : `−${obrot.bet}`}
                  </span>
                )}
                {p.out && <span className="font-display text-xs font-bold uppercase text-czerwien">{t("kasyno.outShort")}</span>}
                <span className="tabular w-14 text-right font-bold text-bursztyn">{p.chips}</span>
              </div>
            );
          })}
        </section>
      </div>
    );
  }

  // ——— KONIEC ———
  if (pub.phase === "koniec") {
    return (
      <div className="flex flex-col items-center gap-4">
        <Podium players={pub.players.map((p) => ({ ...p, score: p.chips }))} meUid={meUid} />
      </div>
    );
  }

  const kolory = pub.mode === "double" ? ["red", "black", "green"] : [];
  const mnozniki = pub.mode === "wheel" ? WHEEL_SEGMENTS.map((s) => String(s.multiplier)) : [];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Saldo + pula */}
      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <span className="font-display rounded-[12px] border-2 border-stroke bg-panel px-3 py-1.5 text-sm font-bold text-ink">
          {t("kasyno.balance")}: <span className="tabular text-bursztyn">{saldo}</span>
        </span>
        <span className="font-display flex items-center gap-2 text-sm font-bold uppercase tracking-[0.06em] text-ink-muted">
          <span>
            {t("common.round")} {pub.round}
            {pub.ante > 0 && ` · ${t("kasyno.anteInfo", { ante: pub.ante })}`}
          </span>
          {pub.phase === "zaklady" && zostalo != null && (
            <span className={`tabular text-base ${zostalo <= 5 ? "timer-urgent" : "text-mint"}`}>{zostalo} s</span>
          )}
        </span>
      </div>

      {/* Pasek losowania / wynik */}
      {(pub.phase === "losowanie" || pub.phase === "wynik") && pub.mode !== "sloty" && (
        <div className="w-full max-w-md">
          <SpinStrip
            items={items}
            targetIndex={targetIndex}
            spinning={pub.phase === "losowanie"}
            durationMs={SPIN_MS[pub.mode] ?? 7000}
            elapsedMs={spinElapsed}
          />
        </div>
      )}

      {pub.mode === "sloty" && (pub.phase === "losowanie" || pub.phase === "wynik") && (
        <ul className="flex w-full max-w-md flex-col gap-2">
          {Object.entries(pub.outcome?.reels ?? {}).map(([uid, r]) => (
            <li key={uid} className="flex items-center gap-3 rounded-[14px] border-[3px] border-stroke bg-panel px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-bold text-ink">{nickOf(uid)}</span>
              <span className="flex gap-1">
                {r.map((sym, i) => (
                  <span key={i} className="flex size-11 items-center justify-center rounded-[10px] border-2 border-white/30 bg-black/30 text-xl">
                    {SYMBOL_LABEL[sym] ?? sym}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Panel obstawiania */}
      {pub.phase === "zaklady" && !odpadl && (
        <div className="flex w-full max-w-md flex-col gap-3">
          {wymagaWyboru && (
            <div className="flex flex-col gap-2">
              <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
                {pub.mode === "double" ? t("kasyno.pickColour") : t("kasyno.pickMultiplier")}
              </span>
              <div className="flex flex-wrap gap-2">
                {(pub.mode === "double" ? kolory : mnozniki).map((opt) => {
                  const wybrany = pick === opt;
                  const tlo = pub.mode === "double" ? COLOUR_BG[opt] : undefined;
                  const etykieta =
                    pub.mode === "double"
                      ? `${t(`kasyno.${opt}` as Parameters<typeof t>[0])} ×${opt === "green" ? 14 : 2}`
                      : `×${opt}`;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={!!mojZaklad}
                      onClick={() => setPick(opt)}
                      className={`font-display min-h-[48px] flex-1 rounded-[14px] border-[3px] px-3 text-sm font-bold uppercase text-white transition-transform duration-75 active:translate-y-[3px] ${
                        wybrany ? "glow-selected" : "border-white/25"
                      }`}
                      style={{ background: tlo ?? "var(--color-panel-hi)" }}
                    >
                      {etykieta}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!mojZaklad ? (
            <>
              <label className="flex items-center gap-3">
                <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
                  {t("kasyno.amount")}
                </span>
                <input
                  type="range"
                  min={Math.min(pub.minBet, saldo)}
                  max={Math.max(saldo, pub.minBet)}
                  step={5}
                  value={stawka}
                  onChange={(e) => setStawka(Number(e.target.value))}
                  className="odcien-slider flex-1"
                  style={{ ["--track" as string]: "linear-gradient(to right,#3A1B9B,#F0B429)" }}
                  aria-label={t("kasyno.amount")}
                />
                <span className="tabular w-14 flex-none text-right font-bold text-bursztyn">{stawka}</span>
              </label>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1 text-sm" onClick={() => setStawka(saldo)}>
                  {t("kasyno.allIn")}
                </button>
                <button type="button" className="btn flex-[2]" disabled={!mozeObstawic || busy} onClick={obstaw}>
                  {busy ? t("kasyno.betPlaced") : t("kasyno.placeBet")}
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: "CLEAR_BET" })}>
              {t("kasyno.clearBet")} ({mojZaklad.amount})
            </button>
          )}
        </div>
      )}

      {odpadl && (
        <p className="font-display rounded-[14px] border-[3px] border-czerwien/60 bg-czerwien/15 px-4 py-3 text-center text-base font-bold uppercase text-czerwien">
          {t("kasyno.out")}
        </p>
      )}

      <Historia history={pub.history} mode={pub.mode} players={pub.players} />

      {/* Zakłady wszystkich — jawne od razu, to połowa zabawy */}
      <section className="flex w-full max-w-md flex-col gap-2">
        <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
          {/* „Pula" tylko tam, gdzie naprawdę jest do wygrania: w Jackpocie ktoś ją
              zgarnia w całości. W Double i Wheel płaci bank wg stałych kursów, a ta
              liczba to tylko suma stawek — nazywanie jej pulą obiecywało nagrodę,
              której nie ma. Sloty mają własną fazę i tu nie trafiają. */}
          {t(pub.mode === "jackpot" ? "kasyno.pot" : "kasyno.stakes")}:{" "}
          <span className="tabular text-bursztyn">{pub.pot}</span>
        </span>
        {pub.bets.length === 0 ? (
          <p className="text-sm font-semibold text-ink-muted">{t("kasyno.noBets")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {pub.bets.map((b) => {
              const g = pub.players.find((p) => p.uid === b.uid);
              const zmiana = pub.delta[b.uid];
              return (
                <li
                  key={b.uid}
                  className={`flex items-center gap-2 rounded-[12px] border-2 px-2 py-1.5 ${
                    b.uid === pub.outcome?.winnerUid && pub.phase !== "losowanie"
                      ? "border-bursztyn bg-panel-hi"
                      : "border-stroke bg-panel"
                  }`}
                  style={b.pick && COLOUR_BG[b.pick] ? { borderColor: COLOUR_BG[b.pick] } : undefined}
                >
                  <AvatarIcon avatar={g?.avatar ?? ""} size={22} />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{g?.nick}</span>
                  {b.pick && (
                    <span className="font-display text-xs font-bold uppercase text-ink-muted">
                      {pub.mode === "wheel" ? `×${b.pick}` : t(`kasyno.${b.pick}` as Parameters<typeof t>[0])}
                    </span>
                  )}
                  <span className="tabular text-sm font-bold text-ink">{b.amount}</span>
                  {zmiana != null && pub.phase !== "zaklady" && (
                    <span className={`tabular text-sm font-bold ${zmiana >= 0 ? "text-mint" : "text-czerwien"}`}>
                      {zmiana >= 0 ? "+" : ""}
                      {zmiana}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Salda wszystkich */}
      <section className="flex w-full max-w-md flex-col gap-1">
        {[...pub.players].sort((a, b) => b.chips - a.chips).map((p) => (
          <div key={p.uid} className={`flex items-center gap-2 text-sm ${p.out ? "opacity-40" : ""}`}>
            <AvatarIcon avatar={p.avatar} size={18} />
            <span className="min-w-0 flex-1 truncate font-semibold text-ink">
              {p.nick}
              {p.uid === meUid && <span className="text-ink-muted"> {t("common.you")}</span>}
            </span>
            {p.out && <span className="font-display text-xs font-bold uppercase text-czerwien">{t("kasyno.outShort")}</span>}
            <span className="tabular font-bold text-bursztyn">{p.chips}</span>
          </div>
        ))}
      </section>

      {isHost && pub.phase === "zaklady" && (
        <button type="button" className="btn btn-ghost w-full max-w-md text-sm" onClick={() => dispatch({ type: "NEXT" })}>
          {t("odcien.closeRound")}
        </button>
      )}
    </div>
  );
}
