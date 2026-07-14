import { EntryForm } from "@/components/EntryForm";
import { normalizeRoomCode } from "@/lib/room-code";

// Deep link /p/K7QM (SPEC §4): od razu ekran nicku, kod wypełniony. Cel skanu QR.
export default async function DeepLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <main className="screen items-center justify-center gap-8">
      <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Dołącz do pokoju
      </h1>
      <EntryForm mode="join" initialCode={normalizeRoomCode(code)} />
    </main>
  );
}
