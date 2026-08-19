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
    <main className="arcade-bg screen relative items-center justify-center gap-6 overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <h1 className="font-display relative text-4xl font-bold uppercase tracking-wide text-ink drop-shadow-[0_4px_0_rgb(0_0_0/0.35)]">
        Dołącz
      </h1>
      <EntryForm mode="join" initialCode={normalizeRoomCode(code)} />
    </main>
  );
}
