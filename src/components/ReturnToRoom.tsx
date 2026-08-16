"use client";
import Link from "next/link";
import { useSession } from "@/lib/store/session";
import { RoomCodeNeon } from "./RoomCodeNeon";

// C1 (UPGRADE.md §C1): propozycja powrotu do aktywnego pokoju.
// Wyświetlana na ekranie startowym, gdy localStorage pamięta aktywną sesję.
export function ReturnToRoom() {
  const activeRoom = useSession((s) => s.activeRoom);
  const setActiveRoom = useSession((s) => s.setActiveRoom);

  if (!activeRoom) return null;

  return (
    <div className="card flex w-full max-w-xs flex-col items-center gap-3 p-4">
      <p className="text-sm text-[var(--color-tekst-drugi)]">Masz aktywny pokój:</p>
      <RoomCodeNeon code={activeRoom.code} accent="#22d3ee" />
      <div className="flex w-full gap-2">
        <Link
          href={`/pokoj/${activeRoom.code}`}
          className="btn btn-accent flex-1 text-center"
        >
          Wróć
        </Link>
        <button
          type="button"
          onClick={() => setActiveRoom(null)}
          className="btn flex-none px-3"
          aria-label="Odrzuć"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
