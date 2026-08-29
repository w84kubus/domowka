"use client";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

/** Wejście do pokoju bez zajmowania miejsca w rozgrywce. */
export function WatchLink({ code }: { code: string }) {
  const t = useT();
  return (
    <Link
      href={`/pokoj/${code}?widz=1`}
      className="font-display relative inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.06em] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
    >
      <Eye size={16} strokeWidth={2.5} aria-hidden /> {t("spectate.action")}
    </Link>
  );
}
