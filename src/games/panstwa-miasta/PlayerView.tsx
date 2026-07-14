"use client";
import { useEffect, useRef, useState } from "react";
import type { GameViewProps } from "@/games/view";
import { sfx } from "@/lib/sound";

interface Common {
  round: number;
  totalRounds: number;
  phase: "losowanie" | "pisanie" | "weryfikacja" | "wyniki" | "koniec";
  letter: string;
  categories: string[];
  players: { uid: string; nick: string; avatar: string; score: number; roundDelta: number }[];
}
type Pub = Common & {
  stoppedBy?: string | null;
  progress?: { uid: string; filled: number }[];
  verifyCat?: number;
  categoryName?: string;
  entries?: { uid: string; answer: string; autoZero: boolean; rejected: boolean }[];
  active?: { targetUid: string; by: string; justification: string; voted: string[]; tally: { uznaje: number; odrzucam: number } } | null;
  breakdown?: { category: string; answers: { uid: string; answer: string; points: number; status: string }[] }[] | null;
};

function useTicker(ms = 300) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

const secLeft = (endsAt: number | null, now: number) => (endsAt == null ? null : Math.max(0, Math.ceil((endsAt - now) / 1000)));

export function PmPlayerView({ room, publicState, privateState, meUid, isHost, dispatch, serverNow, accent }: GameViewProps) {
  const pub = publicState as Pub;
  const nickOf = (uid: string) => pub.players.find((p) => p.uid === uid)?.nick ?? "?";
  useTicker();
  const now = serverNow();

  // ---- FAZA: LOSOWANIE ----
  if (pub.phase === "losowanie") {
    const left = secLeft(room.phaseEndsAt, now);
    return (
      <div className="flex flex-col items-center justify-center gap-6 pt-6 text-center" style={{ ["--accent" as string]: accent }}>
        <p className="text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">Runda {pub.round} — litera</p>
        <div
          className="flex h-40 w-40 items-center justify-center rounded-3xl text-8xl font-bold"
          style={{ background: accent, color: "#0b0a12", boxShadow: `0 0 50px ${accent}88`, fontFamily: "var(--font-display)" }}
        >
          {pub.letter}
        </div>
        <p className="text-[var(--color-tekst-drugi)]">Piszcie za {left ?? 0}…</p>
        <p className="max-w-xs text-xs text-[var(--color-tekst-drugi)]">{pub.categories.join(" · ")}</p>
      </div>
    );
  }

  // ---- FAZA: PISANIE ----
  if (pub.phase === "pisanie") {
    return <WritingPhase pub={pub} room={room} priv={privateState} isHost={isHost} dispatch={dispatch} now={now} accent={accent} nickOf={nickOf} />;
  }

  // ---- FAZA: WERYFIKACJA ----
  if (pub.phase === "weryfikacja") {
    const priv = privateState as { myVote: string | null; amTarget: boolean } | null;
    const cat = pub.categoryName ?? "";
    const active = pub.active ?? null;
    return (
      <div className="flex flex-col gap-4" style={{ ["--accent" as string]: accent }}>
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-[var(--color-tekst-drugi)]">
            Weryfikacja · litera {pub.letter} · {(pub.verifyCat ?? 0) + 1}/{pub.categories.length}
          </p>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: accent }}>{cat}</h2>
        </div>

        {active ? (
          <div className="card flex flex-col gap-3 p-4" style={{ borderColor: accent }}>
            <p className="text-sm text-[var(--color-tekst-drugi)]">Kwestia: odpowiedź <b>{nickOf(active.targetUid)}</b></p>
            <p className="text-center text-lg font-semibold">
              „{pub.entries?.find((e) => e.uid === active.targetUid)?.answer}”
            </p>
            {active.justification && <p className="text-center text-sm italic text-[var(--color-tekst-drugi)]">— {active.justification}</p>}

            {priv?.amTarget ? (
              <JustifyBox dispatch={dispatch} />
            ) : priv?.myVote ? (
              <p className="text-center text-sm text-[var(--color-tekst-drugi)]">Zagłosowano: {priv.myVote === "uznaje" ? "UZNAJĘ" : "ODRZUCAM"}</p>
            ) : (
              <div className="flex gap-2">
                <button className="btn flex-1" onClick={() => dispatch({ type: "VOTE", verdict: "uznaje" })}>UZNAJĘ</button>
                <button className="btn flex-1" onClick={() => dispatch({ type: "VOTE", verdict: "odrzucam" })} style={{ color: "var(--color-magenta)" }}>ODRZUCAM</button>
              </div>
            )}
            <p className="text-center text-xs text-[var(--color-tekst-drugi)]">
              UZNAJĘ {active.tally.uznaje} · ODRZUCAM {active.tally.odrzucam} (remis = uznana)
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {pub.entries?.map((e) => (
              <li key={e.uid} className="card flex items-center gap-3 px-4 py-2">
                <span className="text-sm text-[var(--color-tekst-drugi)]">{nickOf(e.uid)}</span>
                <span className={`flex-1 truncate font-semibold ${e.rejected || e.autoZero ? "text-[var(--color-tekst-drugi)] line-through" : ""}`}>
                  {e.answer || <span className="italic text-[var(--color-tekst-drugi)]">—</span>}
                </span>
                {e.autoZero && <span title="zła litera" className="text-xs text-[var(--color-magenta)]">zła litera</span>}
                {e.rejected && <span className="text-xs text-[var(--color-magenta)]">odrzucona</span>}
                {!e.autoZero && !e.rejected && e.answer && e.uid !== meUid && (
                  <button
                    onClick={() => dispatch({ type: "CHALLENGE", targetUid: e.uid, cat: pub.verifyCat })}
                    className="rounded-md border border-[var(--color-obramowanie)] px-2 py-1 text-xs"
                    aria-label="Kwestionuję"
                  >
                    🚩
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isHost && (
          <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>
            {active ? "Zamknij głosowanie" : (pub.verifyCat ?? 0) + 1 >= pub.categories.length ? "Podlicz wyniki →" : "Następna kategoria →"}
          </button>
        )}
      </div>
    );
  }

  // ---- FAZA: WYNIKI / KONIEC ----
  return (
    <div className="flex flex-col gap-4" style={{ ["--accent" as string]: accent }}>
      <h2 className="text-center text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {pub.phase === "koniec" ? "Koniec gry 🏁" : `Runda ${pub.round} — wyniki`}
      </h2>
      <ul className="flex flex-col gap-1">
        {[...pub.players].sort((a, b) => b.score - a.score).map((p) => (
          <li key={p.uid} className="card flex items-center justify-between px-4 py-2">
            <span>{p.avatar} {p.nick}{p.uid === meUid && " (Ty)"}</span>
            <span className="tabular">
              <b>{p.score}</b>
              {p.roundDelta > 0 && <span className="ml-2 text-sm" style={{ color: accent }}>+{p.roundDelta}</span>}
            </span>
          </li>
        ))}
      </ul>

      {pub.breakdown && (
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--color-tekst-drugi)]">Szczegóły kategorii</summary>
          <div className="mt-2 flex flex-col gap-3">
            {pub.breakdown.map((c) => (
              <div key={c.category}>
                <p className="font-semibold">{c.category}</p>
                {c.answers.filter((a) => a.answer).map((a) => (
                  <div key={a.uid} className="flex justify-between px-2 text-[var(--color-tekst-drugi)]">
                    <span>{nickOf(a.uid)}: {a.answer}</span>
                    <span className="tabular">{a.points}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </details>
      )}

      {isHost && pub.phase === "wyniki" && (
        <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} onClick={() => dispatch({ type: "NEXT" })}>Dalej →</button>
      )}
    </div>
  );
}

function JustifyBox({ dispatch }: { dispatch: (a: unknown) => Promise<void> }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-sm text-[var(--color-tekst-drugi)]">To Twoja odpowiedź — możesz się bronić (15 s):</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={200}
        rows={2}
        placeholder="np. To realne miasto w…"
        className="rounded-lg border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] p-2 text-sm"
      />
      <button
        className="btn"
        disabled={sent || !text.trim()}
        onClick={() => { dispatch({ type: "JUSTIFY", text }); setSent(true); }}
      >
        {sent ? "Wysłano" : "Broń się"}
      </button>
    </div>
  );
}

function WritingPhase({
  pub, room, priv, isHost, dispatch, now, accent, nickOf,
}: {
  pub: Pub; room: GameViewProps["room"]; priv: unknown; isHost: boolean;
  dispatch: (a: unknown) => Promise<void>; now: number; accent: string; nickOf: (u: string) => string;
}) {
  const draftKey = `pm-draft-${room.code}-${pub.round}`;
  const [answers, setAnswers] = useState<string[]>(() => pub.categories.map(() => ""));
  const loaded = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wczytaj draft z localStorage / privateView (odporność na odświeżenie, SPEC §5.3).
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(draftKey) : null;
    const fromPriv = (priv as { answers?: string[] } | null)?.answers;
    if (saved) setAnswers(JSON.parse(saved));
    else if (fromPriv && fromPriv.some((x) => x)) setAnswers(pub.categories.map((_, i) => fromPriv[i] ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const push = (next: string[]) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(draftKey, JSON.stringify(next));
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => dispatch({ type: "SUBMIT_ANSWERS", answers: next }).catch(() => {}), 1200);
  };
  const change = (i: number, v: string) => {
    const next = answers.map((a, idx) => (idx === i ? v : a));
    setAnswers(next);
    push(next);
  };

  const filled = answers.filter((a) => a.trim()).length;
  const allFilled = filled === pub.categories.length;
  const left = secLeft(room.phaseEndsAt, now);

  const stop = async () => {
    if (debounce.current) clearTimeout(debounce.current);
    await dispatch({ type: "SUBMIT_ANSWERS", answers }).catch(() => {});
    await dispatch({ type: "STOP" }).catch(() => {});
    sfx.stop();
  };

  return (
    <div className="flex flex-col gap-3" style={{ ["--accent" as string]: accent }}>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold" style={{ color: accent, fontFamily: "var(--font-display)" }}>{pub.letter}</span>
        <span className="text-sm text-[var(--color-tekst-drugi)]">{filled}/{pub.categories.length}{left != null ? ` · ${left}s` : ""}</span>
      </div>
      {pub.stoppedBy && <p className="text-center text-sm" style={{ color: accent }}>{nickOf(pub.stoppedBy)} skończył! Dokończ szybko.</p>}

      {pub.categories.map((cat, i) => (
        <div key={cat} className="flex flex-col gap-1">
          <label className="text-xs text-[var(--color-tekst-drugi)]">{cat}</label>
          <input
            value={answers[i] ?? ""}
            onChange={(e) => change(i, e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            className="min-h-[52px] rounded-xl border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] px-3 text-[var(--color-tekst)] outline-none focus:border-[var(--color-cyjan)]"
          />
        </div>
      ))}

      <div className="mt-2 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1 text-xs text-[var(--color-tekst-drugi)]">
          {pub.progress?.map((pr) => (
            <span key={pr.uid} className="rounded bg-[var(--color-powierzchnia)] px-2 py-0.5">
              {nickOf(pr.uid)} {pr.filled}/{pub.categories.length}
            </span>
          ))}
        </div>
        {room.gameId && (pub as Pub).stoppedBy == null && (
          <StopOrHost allFilled={allFilled} endMode={endModeOf(room)} isHost={isHost} onStop={stop} onClose={() => dispatch({ type: "NEXT" })} accent={accent} />
        )}
      </div>
    </div>
  );
}

function endModeOf(room: GameViewProps["room"]): string {
  return (room.settings as { endMode?: string })?.endMode ?? "stop";
}

function StopOrHost({ allFilled, endMode, isHost, onStop, onClose, accent }: { allFilled: boolean; endMode: string; isHost: boolean; onStop: () => void; onClose: () => void; accent: string }) {
  return (
    <>
      {endMode === "stop" && (
        <button className="btn btn-accent" style={{ ["--accent" as string]: accent }} disabled={!allFilled} onClick={onStop}>
          {allFilled ? "STOP!" : "Wypełnij wszystkie pola"}
        </button>
      )}
      {isHost && endMode !== "stop" && (
        <button className="btn" onClick={onClose}>Zamknij rundę (host)</button>
      )}
    </>
  );
}
