"use client";
import confetti from "canvas-confetti";

// Konfetti na zwycięstwo (SPEC §6.4). Szanuje prefers-reduced-motion (§6.4).
function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function celebrate(colors?: string[]) {
  if (reducedMotion()) return;
  const opts = { spread: 70, startVelocity: 45, ticks: 200, colors };
  confetti({ ...opts, particleCount: 80, origin: { x: 0.5, y: 0.6 } });
  setTimeout(() => confetti({ ...opts, particleCount: 50, angle: 60, origin: { x: 0, y: 0.7 } }), 150);
  setTimeout(() => confetti({ ...opts, particleCount: 50, angle: 120, origin: { x: 1, y: 0.7 } }), 300);
}

// Złote konfetti — idealne trafienie w Stoperze (SPEC §5.2).
export function celebrateGold() {
  if (reducedMotion()) return;
  confetti({ particleCount: 120, spread: 100, startVelocity: 50, ticks: 250, origin: { x: 0.5, y: 0.5 }, colors: ["#FFD700", "#FFEC8B", "#FFB627"] });
}
