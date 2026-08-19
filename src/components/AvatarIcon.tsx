import Image from "next/image";
import { PawPrint } from "lucide-react";
import { AVATARS } from "@/lib/avatars";

// Wygląd awatara: ilustracja z pakietu (public/avatars/{id}.webp) + kolor kafelka.
// Trzymane osobno od src/lib/avatars.ts — tam lista domenowa, tu warstwa prezentacji.
const COLOR: Record<string, string> = {
  cat: "#E8833A", dog: "#8B6F47", bird: "#3FA9D9", rabbit: "#C9A9A0", panda: "#5B6B7A",
  squirrel: "#B5713C", fish: "#3E86BF", turtle: "#5FA35A", bug: "#C4453C", rat: "#7D8A94",
  snail: "#A8894F", worm: "#D98CA0", shell: "#D9A05B", feather: "#7FB2D4", egg: "#C7A574",
  paw: "#9B7BFF", pizza: "#D4762E", beer: "#D9A32B", guitar: "#B5443C", rocket: "#8A6FD1",
  bot: "#6E8CA0", ghost: "#8E8BC7", skull: "#8A8F99", flame: "#E05C2E", gamepad: "#6BA86B",
  crown: "#E0A02E", diamond: "#4FB3C7", anchor: "#4A7BA8", bike: "#4FA8A0", zap: "#E4B429",
};

const KNOWN = new Set<string>(AVATARS);

/** Kolor kafelka pod awatarem. Nieznana wartość dostaje neutralną szarość. */
export function avatarColor(avatar: string): string {
  return COLOR[avatar] ?? "#7D8A94";
}

/**
 * Awatar jako ilustracja. `size` w px — obrazek jest kwadratowy.
 * Awatary sprzed przejścia na pakiet (emoji zapisane w Firestore) nie mają pliku,
 * więc dostają zapasową ikonę zamiast pustego miejsca albo błędu 404.
 */
export function AvatarIcon({
  avatar,
  size = 24,
  className,
}: {
  avatar: string;
  size?: number;
  className?: string;
}) {
  if (!KNOWN.has(avatar)) {
    return (
      <PawPrint
        size={size}
        strokeWidth={2.5}
        className={`inline-block shrink-0 align-[-0.18em] ${className ?? ""}`}
        aria-hidden
      />
    );
  }
  return (
    <Image
      src={`/avatars/${avatar}.webp`}
      alt=""
      width={size}
      height={size}
      className={`inline-block shrink-0 align-[-0.18em] ${className ?? ""}`}
      aria-hidden
      unoptimized
    />
  );
}
