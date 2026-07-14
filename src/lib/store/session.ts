"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_AVATAR } from "@/lib/avatars";

// Lokalne preferencje gracza (nick, awatar). To NIE jest stan gry (SPEC §11) —
// tylko wygoda, żeby nie wpisywać nicku za każdym razem. Persystujemy w localStorage.
interface SessionState {
  nick: string;
  avatar: string;
  setNick: (nick: string) => void;
  setAvatar: (avatar: string) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      nick: "",
      avatar: DEFAULT_AVATAR,
      setNick: (nick) => set({ nick }),
      setAvatar: (avatar) => set({ avatar }),
    }),
    { name: "domowka-session" },
  ),
);
