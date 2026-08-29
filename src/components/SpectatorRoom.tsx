"use client";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import { RoomCodeNeon } from "@/components/RoomCodeNeon";
import { AvatarIcon } from "@/components/AvatarIcon";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GAME_COMPONENTS } from "@/games/components";
import { GAME_MANIFESTS } from "@/games/manifests";
import type { Room } from "@/lib/types/room";

// Widok widza: wchodzi do pokoju, ale nie zajmuje miejsca w rozgrywce.
//
// Kluczowa decyzja: w trakcie gry pokazujemy HostView danej gry, a nie PlayerView.
// HostView z definicji renderuje wyłącznie stan publiczny — jest robiony pod ekran
// TV, na który patrzą wszyscy naraz, więc z założenia nie może zdradzać ról ani
// tajnych haseł. Dzięki temu tryb widza działa we WSZYSTKICH grach bez pisania
// czegokolwiek per gra i bez ryzyka wycieku: gdyby kiedyś powstała gra, której
// HostView coś ujawnia, byłby to jej własny błąd, widoczny też na telewizorze.
export function SpectatorRoom({
  room,
  serverNow,
}: {
  room: Room;
  serverNow: () => number;
}) {
  const t = useT();
  const gracze = Object.values(room.players);

  const pasek = (
    <p className="font-display inline-flex items-center gap-2 rounded-[14px] border-[3px] border-stroke bg-panel px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
      <Eye size={16} strokeWidth={2.5} aria-hidden /> {t("spectate.badge")}
    </p>
  );

  if (room.status !== "lobby" && room.gameId) {
    const HostView = GAME_COMPONENTS[room.gameId]?.HostView;
    const accent = GAME_MANIFESTS[room.gameId]?.accentColor ?? "#f5f3ff";
    return (
      <main className="arcade-bg screen relative items-center gap-5 overflow-hidden">
        <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex w-full items-center justify-between gap-3">
          <RoomCodeNeon code={room.code} accent={accent} size="1.6rem" />
          {pasek}
        </div>
        <ErrorBoundary context={`spectate:${room.gameId} room:${room.code}`}>
          {HostView && (
            <HostView room={room} publicState={room.publicState} serverNow={serverNow} accent={accent} />
          )}
        </ErrorBoundary>
        <Link href="/" className="btn btn-ghost relative mt-auto">
          {t("spectate.leave")}
        </Link>
      </main>
    );
  }

  return (
    <main className="arcade-bg screen relative items-center gap-6 overflow-hidden text-center">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <RoomCodeNeon code={room.code} />
      {pasek}
      <p className="relative max-w-xs text-base font-semibold text-ink-muted">
        {t("spectate.waiting")}
      </p>
      <ul className="relative flex w-full max-w-md flex-col gap-2">
        {gracze.map((p) => (
          <li
            key={p.uid}
            className="flex items-center gap-3 rounded-[14px] border-[3px] border-stroke bg-panel px-3 py-3 text-left"
          >
            <AvatarIcon avatar={p.avatar} size={28} />
            <span className="flex-1 truncate font-bold text-ink">{p.nick}</span>
          </li>
        ))}
      </ul>
      {/* Widz nie jest graczem, więc dołączenie to zwykłe wejście do pokoju — bez
          żadnego „przełączania trybu", które trzeba by odkręcać po stronie serwera. */}
      <Link href={`/p/${room.code}`} className="btn relative">
        {t("spectate.join")}
      </Link>
    </main>
  );
}
