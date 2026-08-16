"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_AVATAR } from "@/lib/avatars";

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
    { name: "domowka-session" },
  ),
);
