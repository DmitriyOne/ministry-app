import { getTranslations } from "next-intl/server";

import { LockClosedIcon } from "@/shared/ui/icons";
import { ListRow } from "@/shared/ui/list-row";

type ProfileTimeZoneProps = {
  // What the SERVER works this person's months and days out in, already
  // resolved by the read (pages/profile/api/read-profile-page.ts), so
  // this block prints a fact rather than a stored string that may not be
  // the one in use.
  timeZone: string;
  // Whether a row follows it inside the card. The widget renders a ROW,
  // not a card (ADR 0061, update 2026-11-07, variant D): the screen owns
  // the card, because the row below it belongs to another slice.
  divided?: boolean;
};

// Which calendar the app counts in, said out loud.
//
// It is read-only, and that is the whole reason it exists (ADR 0061,
// update 2026-11-07). The column has no write grant — the migration that
// added it left the grant to the migration that would add a screen for
// changing it, and that screen has not come — so every profile carries
// the Europe/London default. Until now nothing in the app said so, and a
// person whose phone is somewhere else had no way to find out why "Today"
// sometimes meant yesterday for a few hours.
//
// Nothing here is pressable: no switch, no chevron. The sentence under
// the title still carries "yet" in words, because the padlock can say
// "fixed" and cannot say "for now" — and a value shown without that
// reads as a setting whose screen you simply have not found.
//
// The value sits in a tinted pill at caption size rather than at row
// size: an IANA name can run to "America/Argentina/Buenos_Aires", and
// the smaller type keeps it beside the title on a phone instead of
// crushing it. The padlock is the one the year screen puts on a closed
// month — the same glyph for the same fact, that this is not yours to
// change, rather than a second lock drawn for this row.
export const ProfileTimeZone = async ({ timeZone, divided = true }: ProfileTimeZoneProps) => {
  const t = await getTranslations("screens.profile.timeZone");

  return (
    <ListRow
      title={t("title")}
      text={t("text")}
      divided={divided}
      trailing={(
        <span className="flex shrink-0 items-center gap-1.5 rounded-xs bg-ink-a05 px-2.5 py-1.5">
          <LockClosedIcon size={13} className="shrink-0 text-ink-muted" />
          <span className="text-caption font-580 text-ink">{timeZone}</span>
        </span>
      )}
    />
  );
};
