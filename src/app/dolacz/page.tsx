import { EntryForm } from "@/components/EntryForm";

// Dołączanie kodem (SPEC §4): kod + nick + awatar.
export default function DolaczPage() {
  return (
    <main className="screen items-center justify-center gap-8">
      <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Dołącz do pokoju
      </h1>
      <EntryForm mode="join" />
    </main>
  );
}
