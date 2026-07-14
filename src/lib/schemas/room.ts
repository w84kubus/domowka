import { z } from "zod";
import { AVATARS } from "@/lib/avatars";
import { isValidRoomCode } from "@/lib/room-code";

export const MAX_NICK_LENGTH = 16;

/** Sanityzacja nicku (SPEC §4): trim, bez nowych linii, niepusty, max 16 znaków. Emoji dozwolone. */
export function sanitizeNick(raw: string): string {
  return raw
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NICK_LENGTH);
}

const nickSchema = z
  .string()
  .transform(sanitizeNick)
  .refine((n) => n.length > 0, { message: "Podaj nick." });

const avatarSchema = z
  .string()
  .refine((a) => AVATARS.includes(a), { message: "Nieznany awatar." });

export const createRoomSchema = z.object({
  nick: nickSchema,
  avatar: avatarSchema,
});

export const joinRoomSchema = z.object({
  nick: nickSchema,
  avatar: avatarSchema,
});

export const codeParamSchema = z
  .string()
  .transform((c) => c.toUpperCase())
  .refine(isValidRoomCode, { message: "Nieprawidłowy kod pokoju." });

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

/** Zapewnia unikalność nicku w pokoju: przy duplikacie dopisuje (2), (3)... (SPEC §4). */
export function dedupeNick(nick: string, existing: string[]): string {
  const taken = new Set(existing);
  if (!taken.has(nick)) return nick;
  for (let n = 2; ; n++) {
    const candidate = `${nick} (${n})`;
    if (!taken.has(candidate)) return candidate;
  }
}
