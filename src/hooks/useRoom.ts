"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { Room } from "@/lib/types/room";

interface RoomState {
  room: Room | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

/**
 * Realtime subskrypcja dokumentu pokoju (SPEC §3.1: klient tylko CZYTA).
 * Wymaga wcześniejszego uwierzytelnienia (reguły §3.3 wpuszczają tylko graczy/obserwatorów).
 */
export function useRoom(code: string | null, authReady: boolean): RoomState {
  const [state, setState] = useState<RoomState>({
    room: null,
    loading: true,
    error: null,
    notFound: false,
  });

  useEffect(() => {
    if (!code || !authReady) return;
    const ref = doc(getDb(), "rooms", code);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState({ room: null, loading: false, error: null, notFound: true });
          return;
        }
        // hasPendingWrites (§8 pkt 9) nas tu nie dotyczy — klient nie pisze do pokoju.
        setState({
          room: snap.data() as Room,
          loading: false,
          error: null,
          notFound: false,
        });
      },
      (err) => {
        setState({
          room: null,
          loading: false,
          error: err.message,
          notFound: false,
        });
      },
    );
    return unsub;
  }, [code, authReady]);

  return state;
}
