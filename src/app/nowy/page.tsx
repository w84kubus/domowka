import { EntryForm } from "@/components/EntryForm";

// Zakładanie pokoju (SPEC §4): nick + awatar, potem redirect do lobby.
export default function NowyPage() {
  return (
    <main className="screen items-center justify-center gap-8">
      <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Nowy pokój
      </h1>
      <EntryForm mode="create" />
    </main>
  );
}
