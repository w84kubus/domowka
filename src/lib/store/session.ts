"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AVATARS, DEFAULT_AVATAR } from "@/lib/avatars";

// Lokalne preferencje gracza (nick, awatar) + aktywna sesja pokoju (UPGRADE.md §C1).
// To NIE jest stan gry (SPEC §11) — tylko wygoda, żeby nie wpisywać nicku za każdym razem
// i umożliwienie powrotu do pokoju po odświeżeniu/zamknięciu.
// Persystujemy w localStorage.
interface SessionState {
  nick: string;
  avatar: string;
  // Aktywna sesja pokoju — pozwala na powrót do gry (C1).
  activeRoom: { code: string; nick: string } | null;
  setNick: (nick: string) => void;
  setAvatar: (avatar: string) => void;
  setActiveRoom: (room: { code: string; nick: string } | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      nick: "",
      avatar: DEFAULT_AVATAR,
      activeRoom: null,
      setNick: (nick) => set({ nick }),
      setAvatar: (avatar) => set({ avatar }),
      setActiveRoom: (activeRoom) => set({ activeRoom }),
    }),
    {
      // Nazwa sprzed rebrandingu na Doplay — patrz LOCALE_COOKIE w i18n/types.ts.
      // Zmiana odcięłaby wracających graczy od zapisanego nicku, awatara i pokoju.
      name: "domowka-session",
      // v1: awatary z emoji na identyfikatory ikon. Bez migracji wracający gracz
      // ma w localStorage np. "🦊", nic nie jest zaznaczone w siatce i wybór
      // wygląda na pusty. Serwer takie wartości nadal przyjmuje (isValidAvatar),
      // ale UI musi pokazywać to, co faktycznie wyśle.
      version: 1,
      migrate: (persisted) => {
        const prev = (persisted ?? {}) as Partial<SessionState>;
        const known = (AVATARS as readonly string[]).includes(prev.avatar ?? "");
        return { ...prev, avatar: known ? prev.avatar : DEFAULT_AVATAR } as SessionState;
      },
    },
  ),
);
