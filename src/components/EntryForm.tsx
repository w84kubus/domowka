"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CodeInput } from "./CodeInput";
import { AvatarPicker } from "./AvatarPicker";
import { useSession } from "@/lib/store/session";
import { apiPost } from "@/lib/client/api";
import { MAX_NICK_LENGTH, sanitizeNick } from "@/lib/schemas/room";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/room-code";

// Wspólny formularz wejścia (SPEC §4). Tryb "create" zakłada pokój, "join" dołącza kodem.
export function EntryForm({
  mode,
  initialCode = "",
}: {
  mode: "create" | "join";
  initialCode?: string;
}) {
  const router = useRouter();
  const { nick, avatar, setNick, setAvatar } = useSession();
  const [code, setCode] = useState(normalizeRoomCode(initialCode));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nickOk = sanitizeNick(nick).length > 0;
  const codeOk = mode === "create" || isValidRoomCode(code);
  const canSubmit = nickOk && codeOk && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "create") {
        const { code: newCode } = await apiPost<{ code: string }>("/api/rooms", {
          nick,
          avatar,
        });
        router.push(`/pokoj/${newCode}`);
      } else {
        await apiPost(`/api/rooms/${code}/join`, { nick, avatar });
        router.push(`/pokoj/${code}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coś poszło nie tak.");
      setBusy(false);
    }
  };

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {mode === "join" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-[var(--color-tekst-drugi)]">Kod pokoju</label>
          <CodeInput value={code} onChange={setCode} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="nick" className="text-sm text-[var(--color-tekst-drugi)]">
          Twój nick
        </label>
        <input
          id="nick"
          value={nick}
          onChange={(e) => setNick(e.target.value.replace(/[\r\n]/g, ""))}
          maxLength={MAX_NICK_LENGTH * 2}
          placeholder="np. Damian"
          autoComplete="off"
          className="min-h-[56px] rounded-xl border border-[var(--color-obramowanie)] bg-[var(--color-powierzchnia)] px-4 text-lg text-[var(--color-tekst)] outline-none focus:border-[var(--color-cyjan)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-[var(--color-tekst-drugi)]">Awatar</span>
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </div>

      {error && (
        <p className="rounded-lg bg-[var(--color-uniesione)] px-3 py-2 text-sm text-[var(--color-magenta)]">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-accent" disabled={!canSubmit}>
        {busy ? "Chwila…" : mode === "create" ? "Zakładam pokój" : "Dołączam"}
      </button>

      <Link
        href="/"
        className="text-center text-sm text-[var(--color-tekst-drugi)] underline underline-offset-4"
      >
        ← wróć
      </Link>
    </form>
  );
}
