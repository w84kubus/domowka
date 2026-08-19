import { EntryForm } from "@/components/EntryForm";

// Dołączanie kodem (SPEC §4): kod + nick + awatar.
export default function DolaczPage() {
  return (
    <main className="arcade-bg screen relative items-center justify-center gap-6 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <h1 className="font-display relative text-4xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_4px_0_rgb(0_0_0/0.35)]">
        Dołącz
      </h1>
      <EntryForm mode="join" />
    </main>
  );
}
