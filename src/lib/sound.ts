"use client";
// Krótkie SFX przez WebAudio (SPEC §6.4) — nie <audio> (za duże opóźnienie).
// AudioContext trzeba odblokować pierwszym tapnięciem użytkownika (iOS, SPEC §8 pkt 7).

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Wywołaj przy pierwszym tapnięciu (np. w lobby), żeby dźwięk działał na iOS. */
export function unlockAudio() {
  const c = ac();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

function tone(freq: number, durMs: number, type: OscillatorType = "sine", gain = 0.15) {
  const c = ac();
  if (!c || muted) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + durMs / 1000);
}

export const sfx = {
  start: () => tone(880, 120, "square", 0.12), // beep startu
  stop: () => tone(220, 90, "square", 0.14), // klik stopu
  tick: () => tone(600, 40, "sine", 0.08),
  perfect: () => {
    tone(880, 120, "triangle", 0.15);
    setTimeout(() => tone(1320, 200, "triangle", 0.15), 110);
  },
  fanfara: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 180, "triangle", 0.14), i * 120));
  },
  // D5/D6: nowe dźwięki
  /** Dołączenie gracza — krótki „pop" */
  join: () => tone(1200, 60, "sine", 0.1),
  /** Zmiana fazy — niski swoosh */
  phaseChange: () => {
    tone(200, 300, "sine", 0.08);
    setTimeout(() => tone(400, 200, "sine", 0.1), 150);
  },
  /** Timer <5 s — przyśpieszony tick */
  urgentTick: () => tone(800, 30, "square", 0.1),
  /** Porażka — krótki dong */
  defeat: () => {
    tone(220, 400, "sine", 0.12);
    setTimeout(() => tone(165, 500, "sine", 0.1), 200);
  },
  /** Neon buzz — krótkie bzzt rurki neonowej (raz, przy ładowaniu kodu) */
  neonBuzz: () => {
    const c = ac();
    if (!c || muted) return;
    if (c.state === "suspended") c.resume().catch(() => {});
    // Szum biały, krótki, cichy — imitacja zapalania rurki
    const bufSize = c.sampleRate * 0.06; // 60ms
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.04;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
    const bpf = c.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 120;
    bpf.Q.value = 2;
    src.connect(bpf).connect(g).connect(c.destination);
    src.start();
  },
};

/** Wibracja (SPEC §5.2). iOS Safari tego nie wspiera — to bonus, nie feedback podstawowy. */
export function vibrate(ms = 30) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}
