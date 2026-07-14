"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

// Subskrypcja rooms/{code}/private/{uid} — tajemnice tylko dla mnie (SPEC §3.1).
// Reguły (§3.3) wpuszczają wyłącznie właściciela uid.
export function usePrivate(code: string | null, uid: string | null, authReady: boolean): unknown {
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    if (!code || !uid || !authReady) return;
    const ref = doc(getDb(), "rooms", code, "private", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => setPayload(snap.exists() ? (snap.data() as { payload: unknown }).payload : null),
      () => setPayload(null),
    );
    return unsub;
  }, [code, uid, authReady]);

  return payload;
}
