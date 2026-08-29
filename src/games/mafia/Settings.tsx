"use client";
import { useT } from "@/lib/i18n/provider";
import { SegmentPicker } from "@/components/SegmentPicker";
import type { GameSettingsProps } from "@/games/view";
import type { MafiaSettings } from "./manifest";
import { autoMafiaCount } from "./manifest";
import { OPTIONAL_ROLES } from "./roles";

export function MafiaSettingsPanel({ value, onChange, playerCount }: GameSettingsProps<MafiaSettings>) {
  const t = useT();
  const set = (patch: Partial<MafiaSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-5">
      {playerCount < 6 && (
        <p className="rounded-[14px] border-2 border-bursztyn/50 bg-bursztyn/15 px-3 py-2 text-xs font-bold text-bursztyn">
          {t("mafia.minPlayersHint")}
        </p>
      )}
      <SegmentPicker label={t("set.maf.count")} value={value.mafiaCount} onChange={(v) => set({ mafiaCount: v as number })}
        hint={`Auto dla ${playerCount} graczy: ${autoMafiaCount(playerCount)}`}
        options={[{ v: 0, l: t("opt.auto") }, { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }, { v: 4, l: "4" }, { v: 5, l: "5" }]} />
      <SegmentPicker label={t("set.maf.reveal")} value={value.revealRoles} onChange={(v) => set({ revealRoles: v as boolean })}
        options={[{ v: true, l: t("opt.yes") }, { v: false, l: t("opt.no") }]} />
      <SegmentPicker label={t("set.maf.discussion")} value={value.discussionMs} onChange={(v) => set({ discussionMs: v as MafiaSettings["discussionMs"] })}
        options={[{ v: 120000, l: "2 min" }, { v: 180000, l: "3 min" }, { v: 300000, l: "5 min" }, { v: 0, l: "∞" }]} />
      <SegmentPicker label={t("set.maf.voting")} value={value.secretVoting} onChange={(v) => set({ secretVoting: v as boolean })}
        options={[{ v: false, l: t("opt.maf.open") }, { v: true, l: t("opt.maf.secret") }]} />
      <SegmentPicker label={t("set.maf.selfsave")} value={value.doctorSelfSave} onChange={(v) => set({ doctorSelfSave: v as boolean })}
        options={[{ v: true, l: t("opt.yes") }, { v: false, l: t("opt.no") }]} />
      {/* Role dodatkowe: przełączniki, nie liczniki — każda z tych ról występuje
          w rozdaniu najwyżej raz, więc licznik sugerowałby możliwość, której nie ma.
          Limit „suma ról ≤ gracze − mafiozi" pilnuje samo rozdanie. */}
      <div className="flex flex-col gap-2">
        <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
          {t("mafia.extraRoles")}
        </span>
        <div className="flex flex-wrap gap-2">
          {OPTIONAL_ROLES.map((rola) => {
            const wlaczona = value.extraRoles.includes(rola);
            return (
              <button
                key={rola}
                type="button"
                aria-pressed={wlaczona}
                onClick={() =>
                  set({
                    extraRoles: wlaczona
                      ? value.extraRoles.filter((r) => r !== rola)
                      : [...value.extraRoles, rola],
                  })
                }
                className={`font-display rounded-[14px] border-[3px] px-3 py-2 text-sm font-bold uppercase tracking-[0.04em] transition-transform duration-75 active:translate-y-[2px] ${
                  wlaczona ? "border-mint bg-mint/20 text-ink" : "border-stroke bg-panel text-ink-muted"
                }`}
              >
                {t(`mafia.role.${rola}` as "mafia.role.szeryf")}
              </button>
            );
          })}
        </div>
        <p className="text-xs font-semibold leading-snug text-ink-muted">
          {value.extraRoles.map((r) => t(`mafia.role.${r}.desc` as "mafia.role.szeryf.desc")).join(" ")}
        </p>
      </div>

      <SegmentPicker label={t("set.maf.norepeat")} value={value.doctorNoRepeat} onChange={(v) => set({ doctorNoRepeat: v as boolean })}
        options={[{ v: true, l: t("opt.wis.forbidden") }, { v: false, l: t("opt.wis.allowed") }]} />
    </div>
  );
}
