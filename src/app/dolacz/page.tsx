"use client";
import { EntryForm } from "@/components/EntryForm";
import { EntryHeader } from "@/components/EntryHeader";

// Dołączanie kodem (SPEC §4): kod + nick + awatar.
export default function DolaczPage() {
  return (
    <main className="arcade-bg screen relative items-center justify-center gap-6 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <EntryHeader mode="join" />
      <EntryForm mode="join" withTabs />
    </main>
  );
}
