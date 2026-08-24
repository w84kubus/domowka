"use client";
import { useEffect, useRef, useState } from "react";
import { SLOT_SYMBOLS } from "./tables";

const SYMBOL: Record<string, string> = {
  cherry: "🍒", lemon: "🍋", bell: "🔔", star: "⭐", gem: "💎", seven: "7️⃣",
};

const ROW = 76; // wysokość jednego symbolu

/**
 * Maszyna z trzema bębnami. Bębny zatrzymują się PO KOLEI, z opóźnieniem —
 * bez tego wszystkie stają naraz i znika napięcie, które jest sensem slotów.
 *
 * Wynik przychodzi z serwera i jest znany od początku: zakład został już
 * postawiony, więc wcześniejsza znajomość układu nic nie zmienia.
 */
export function SlotMachine({
  reels,
  spinning,
  onSettled,
}: {
  reels: string[] | null;
  spinning: boolean;
  onSettled?: () => void;
}) {
  return (
    <div className="flex justify-center gap-2 rounded-[20px] border-[4px] border-bursztyn bg-black/40 p-3">
      {[0, 1, 2].map((i) => (
        <Reel
          key={i}
          target={reels?.[i] ?? null}
          spinning={spinning}
          delayMs={i * 550}
          onSettled={i === 2 ? onSettled : undefined}
        />
      ))}
    </div>
  );
}

function Reel({
  target,
  spinning,
  delayMs,
  onSettled,
}: {
  target: string | null;
  spinning: boolean;
  delayMs: number;
  onSettled?: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startedFor = useRef<string | null>(null);

  const n = SLOT_SYMBOLS.length;
  const loops = 7;
  const strip = Array.from({ length: (loops + 2) * n }, (_, i) => SLOT_SYMBOLS[i % n]);

  useEffect(() => {
    if (!spinning || !target) return;
    const id = `${target}-${delayMs}`;
    if (startedFor.current === id) return;
    startedFor.current = id;

    const reduced =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const idx = SLOT_SYMBOLS.indexOf(target as (typeof SLOT_SYMBOLS)[number]);
    const docelowy = (loops * n + Math.max(0, idx)) * ROW;

    if (reduced) {
      setAnimating(false);
      setOffset(docelowy);
      onSettled?.();
      return;
    }

    setAnimating(false);
    setOffset(0);
    const start = setTimeout(() => {
      setAnimating(true);
      setOffset(docelowy);
    }, 30 + delayMs);
    const done = setTimeout(() => onSettled?.(), 30 + delayMs + 1500);
    return () => {
      clearTimeout(start);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, target, delayMs, n]);

  useEffect(() => {
    if (!spinning) startedFor.current = null;
  }, [spinning]);

  return (
    <div className="relative overflow-hidden rounded-[12px] border-2 border-white/25 bg-panel" style={{ width: ROW, height: ROW }}>
      <div
        className="flex flex-col"
        style={{
          transform: `translateY(-${offset}px)`,
          transition: animating ? `transform 1500ms cubic-bezier(0.15, 0.7, 0.15, 1)` : "none",
        }}
      >
        {strip.map((sym, i) => (
          <span key={i} className="flex flex-none items-center justify-center text-4xl" style={{ height: ROW }}>
            {SYMBOL[sym] ?? sym}
          </span>
        ))}
      </div>
    </div>
  );
}
