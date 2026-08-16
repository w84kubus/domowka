"use client";
import { useEffect, useState } from "react";

// C4 (UPGRADE.md §C4): cienki pasek u góry „Brak połączenia — próbuję wrócić".
// Nie modal — nie blokuje gry. Znika automatycznie po odzyskaniu połączenia.
export function ConnectionBar() {
  const [online, setOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Startowy stan.
    setOnline(navigator.onLine);

    const goOffline = () => {
      setOnline(false);
      setWasOffline(true);
    };
    const goOnline = () => {
      setOnline(true);
      // Pokaż "Połączono" przez 2s, potem schowaj.
      setTimeout(() => setWasOffline(false), 2000);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online && !wasOffline) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center px-4 py-1.5 text-sm font-medium"
      style={{
        background: online ? "#166534" : "#991b1b",
        color: "#fff",
        paddingTop: "max(0.375rem, env(safe-area-inset-top))",
      }}
      role="status"
      aria-live="polite"
    >
      {online ? "✓ Połączono" : "Brak połączenia — próbuję wrócić…"}
    </div>
  );
}
