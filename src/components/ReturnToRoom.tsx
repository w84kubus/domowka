"use client";
import { useT } from "@/lib/i18n/provider";
import { X } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/store/session";
import { RoomCodeNeon } from "./RoomCodeNeon";

// C1 (UPGRADE.md §C1): propozycja powrotu do aktywnego pokoju.
// Wyświetlana na ekranie startowym, gdy localStorage pamięta aktywną sesję.
export function ReturnToRoom() {
  const t = useT();
  const activeRoom = useSession((s) => s.activeRoom);
  const setActiveRoom = useSession((s) => s.setActiveRoom);

  if (!activeRoom) return null;

  return (
    <div className="card arcade-pop relative flex w-full max-w-xs flex-col items-center gap-4">
      <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-mint">
        {t("conn.returnTitle")}
      </p>
      <RoomCodeNeon code={activeRoom.code} size="2rem" />
      <div className="flex w-full gap-2">
        <Link href={`/pokoj/${activeRoom.code}`} className="btn flex-1 px-4 text-base">
          {t("conn.return")}
        </Link>
        <button
          type="button"
          onClick={() => setActiveRoom(null)}
          className="btn btn-ghost flex-none px-4 text-xl"
          aria-label={t("conn.returnTitle")}
        >
          <X size={18} strokeWidth={3} aria-hidden />
        </button>
      </div>
    </div>
  );
}
