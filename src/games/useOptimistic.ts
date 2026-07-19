"use client";
import { useEffect, useRef, useState } from "react";

// Optymistyczne UI: klient nie pisze stanu gry (SPEC §3.1), więc nie przewidujemy publicState.
// Zamiast tego dajemy NATYCHMIASTOWY lokalny feedback na własną akcję i zerujemy go, gdy dotrze
// autorytatywny snapshot (zmiana room.version) albo po bezpieczniku czasowym (gdyby akcja padła).

export function useSent(resetKey: unknown): [boolean, () => void] {
  const [sent, setSent] = useState(false);
  const prev = useRef(resetKey);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prev.current !== resetKey) {
      prev.current = resetKey;
      setSent(false);
    }
  }, [resetKey]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const mark = () => {
    setSent(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSent(false), 3000); // bezpiecznik, gdyby akcja się nie powiodła
  };
  return [sent, mark];
}

export function usePendingSet(resetKey: unknown): [Set<string>, (v: string) => void] {
  const [set, setSet] = useState<Set<string>>(new Set());
  const prev = useRef(resetKey);
  useEffect(() => {
    if (prev.current !== resetKey) {
      prev.current = resetKey;
      setSet(new Set());
    }
  }, [resetKey]);
  const add = (v: string) => setSet((s) => (s.has(v) ? s : new Set(s).add(v)));
  return [set, add];
}
