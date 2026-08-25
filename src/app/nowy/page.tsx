"use client";
import { EntryForm } from "@/components/EntryForm";
import { EntryHeader } from "@/components/EntryHeader";

// Zakładanie pokoju (SPEC §4): nick + awatar, potem redirect do lobby.
// Tryb wybiera się zakładką nad panelem — /dolacz to ta sama strona z drugą zakładką.
export default function NowyPage() {
  return (
    <main className="arcade-bg screen relative items-center justify-center gap-6 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <EntryHeader mode="create" />
      <EntryForm mode="create" withTabs />
    </main>
  );
}
