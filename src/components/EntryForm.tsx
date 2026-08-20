"use client";
import { useT } from "@/lib/i18n/provider";
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
  const t = useT();
  const router = useRouter();
  const { nick, avatar, setNick, setAvatar, setActiveRoom } = useSession();
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
        setActiveRoom({ code: newCode, nick });
        router.push(`/pokoj/${newCode}`);
      } else {
        await apiPost(`/api/rooms/${code}/join`, { nick, avatar });
        setActiveRoom({ code, nick });
        router.push(`/pokoj/${code}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("entry.error"));
      setBusy(false);
    }
  };

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="card arcade-pop flex flex-col gap-5">
        {mode === "join" && (
          <div className="flex flex-col gap-2">
            <label className="font-display text-sm font-bold uppercase tracking-[0.06em] text-mint">
              {t("entry.code")}
            </label>
            <CodeInput value={code} onChange={setCode} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="nick"
            className="font-display text-sm font-bold uppercase tracking-[0.06em] text-mint"
          >
            {t("entry.nick")}
          </label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(e.target.value.replace(/[\r\n]/g, ""))}
            maxLength={MAX_NICK_LENGTH * 2}
            placeholder={t("entry.nickPlaceholder")}
            autoComplete="off"
            className="min-h-[56px] rounded-[14px] border-[3px] border-stroke bg-panel px-4 text-lg font-bold text-ink shadow-[0_3px_0_rgb(0_0_0/0.35)] outline-none transition-colors placeholder:font-semibold placeholder:text-ink-muted/60 focus:border-mint focus:bg-panel-hi"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-display text-sm font-bold uppercase tracking-[0.06em] text-mint">
            {t("entry.avatar")}
          </span>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-[14px] border-[3px] border-white/40 bg-czerwien/90 px-4 py-3 text-center font-body text-sm font-bold text-white shadow-[0_3px_0_rgb(0_0_0/0.35)]"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className={`btn ${mode === "create" ? "btn-coral" : ""}`}
        disabled={!canSubmit}
      >
        {busy ? t("common.loading") : t(mode === "create" ? "entry.creating" : "entry.joining")}
      </button>

      <Link
        href="/"
        className="font-display text-center text-sm font-bold uppercase tracking-[0.06em] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        {t("common.back")}
      </Link>
    </form>
  );
}
