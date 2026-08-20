// Ekran startowy (SPEC §4) + landing.
// G2: deep link /?kod=XYZW → redirect do /p/XYZW (UPGRADE.md §G).
// Sam widok siedzi w LandingContent (klient) — tutaj zostaje tylko logika deep linku,
// która musi wykonać się na serwerze przed renderem.
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/LandingContent";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/room-code";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kod?: string }>;
}) {
  const { kod } = await searchParams;
  if (kod) {
    const code = normalizeRoomCode(kod);
    if (isValidRoomCode(code)) redirect(`/p/${code}`);
  }
  return <LandingContent />;
}
