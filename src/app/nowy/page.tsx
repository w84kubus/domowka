import { EntryForm } from "@/components/EntryForm";

// Zakładanie pokoju (SPEC §4): nick + awatar, potem redirect do lobby.
export default function NowyPage() {
  return (
    <main className="arcade-bg screen relative items-center justify-center gap-6 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <h1 className="font-display text-gradient relative text-4xl font-bold tracking-wide">
        Nowy pokój
      </h1>
      <EntryForm mode="create" />
    </main>
  );
}
