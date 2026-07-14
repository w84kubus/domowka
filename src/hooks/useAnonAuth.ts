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
    ensureAnonAuth()
      .then((user) => {
        if (active) setState({ user, uid: user.uid, loading: false, error: null });
      })
      .catch((err) => {
        if (active)
          setState({
            user: null,
            uid: null,
            loading: false,
            error: err?.message ?? "Nie udało się zalogować anonimowo.",
          });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
