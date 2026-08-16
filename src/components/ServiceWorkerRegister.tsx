"use client";
import { useEffect } from "react";

// Rejestracja service workera (Serwist, UPGRADE.md §B2).
// register: false w next.config.ts — rejestrujemy ręcznie, żeby kontrolować timing.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
