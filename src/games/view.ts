import type { Room } from "@/lib/types/room";

// Propsy przekazywane do widoków gry przez harness kliencki. Rdzeń nie wie nic o konkretnej grze.

export interface GameViewProps {
  room: Room;
  publicState: unknown; // room.publicState
  privateState: unknown; // payload z private/{uid}
  meUid: string;
  isHost: boolean;
  serverNow: () => number;
  dispatch: (action: unknown) => Promise<void>;
  accent: string;
}

export interface GameHostViewProps {
  room: Room;
  publicState: unknown;
  serverNow: () => number;
  accent: string;
}

export interface GameSettingsProps<C = unknown> {
  value: C;
  onChange: (next: C) => void;
  playerCount: number;
}
