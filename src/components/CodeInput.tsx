"use client";
import { useRef } from "react";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, normalizeRoomCode } from "@/lib/room-code";

// Cztery duże kratki na kod (SPEC §4): auto-advance, wklejanie działa, backspace cofa.
export function CodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(ROOM_CODE_LENGTH, " ").slice(0, ROOM_CODE_LENGTH).split("");

  const focus = (i: number) => refs.current[Math.max(0, Math.min(ROOM_CODE_LENGTH - 1, i))]?.focus();

  const setChar = (i: number, raw: string) => {
    const ch = normalizeRoomCode(raw).slice(-1);
    const arr = value.split("");
    if (ch) {
      arr[i] = ch;
      onChange(arr.join("").slice(0, ROOM_CODE_LENGTH));
      focus(i + 1);
    }
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Kod pokoju">
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={ch.trim()}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={1}
          aria-label={`Znak ${i + 1}`}
          onChange={(e) => setChar(i, e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = normalizeRoomCode(e.clipboardData.getData("text"));
            if (pasted) {
              onChange(pasted);
              focus(pasted.length);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              const arr = value.split("");
              if (arr[i]) {
                arr[i] = "";
                onChange(arr.join(""));
              } else {
                focus(i - 1);
                const prev = value.split("");
                prev[i - 1] = "";
                onChange(prev.join(""));
              }
            } else if (e.key === "ArrowLeft") focus(i - 1);
            else if (e.key === "ArrowRight") focus(i + 1);
          }}
          className="font-display h-16 w-14 rounded-[14px] border-[3px] border-stroke bg-panel text-center text-3xl font-bold uppercase text-ink shadow-[0_3px_0_rgb(0_0_0/0.35)] outline-none transition-colors focus:border-mint focus:bg-panel-hi"
          data-alphabet={ROOM_CODE_ALPHABET}
        />
      ))}
    </div>
  );
}
