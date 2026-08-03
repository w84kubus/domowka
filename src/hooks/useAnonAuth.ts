"use client";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ensureAnonAuth } from "@/lib/firebase/client";

interface AnonAuthState {
  user: User | null;
  uid: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Zapewnia anonimową sesję. uid persystuje w IndexedDB → odświeżenie strony
 * NIE wyrzuca gracza (SPEC §3.7, DoD). Wołane na każdym ekranie wymagającym tożsamości.
 */
export function useAnonAuth(): AnonAuthState {
  const [state, setState] = useState<AnonAuthState>({
    user: null,
    uid: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const tryAuth = () => {
      ensureAnonAuth()
        .then((user) => {
          if (active) setState({ user, uid: user.uid, loading: false, error: null });
        })
        .catch((err) => {
          if (!active) return;
          if (attempt < 4) {
            attempt++;
            retryTimer = setTimeout(tryAuth, 500 * attempt); // przejściowy błąd sieci → ponów
          } else {
            setState({ user: null, uid: null, loading: false, error: err?.message ?? "Nie udało się zalogować anonimowo." });
          }
        });
    };
    tryAuth();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return state;
}
