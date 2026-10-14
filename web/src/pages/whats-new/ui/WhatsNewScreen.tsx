import { getTranslations } from "next-intl/server";

import { ScreenBackHeader } from "@/features/screen-back";
import { MarkWhatsNewSeen } from "@/features/whats-new";
import { AppMark } from "@/shared/ui/app-mark";
import { CenteredState } from "@/shared/ui/centered-state";
// Three of these are stand-ins. The set has no bell, no phone and no
// envelope, and adding icons is the owner's call, not a detail to slip
// into a screen: notifications borrow the info circle, "iPhone only"
// borrows the closed lock (it is a restriction), and the waiting list
// borrows the tick. Install uses the compass deliberately — the same
// glyph /about gives that row.
import {
  CalendarWeekIcon,
  CheckCircleIcon,
  CompassIcon,
  InfoCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserIcon,
  WifiOffIcon,
} from "@/shared/ui/icons";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";
import { TextBlock } from "@/shared/ui/text-block";

import { VersionHeading } from "./VersionHeading";

// The release history people see, in the same frame as /about and
// /privacy: sticky back header, green hero block, cards of rows. The
// versions are written out rather than driven by a list, because there
// are two of them and each one's rows are different prose — a loop over
// a config would buy nothing and cost the dictionary its literal keys,
// which are what makes a missing string a compile error (ADR 0014).
export const WhatsNewScreen = async () => {
  const t = await getTranslations("screens.whatsNew");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Marks this version read for this person. It renders nothing;
          see the component for why the write is an effect and not part
          of rendering this screen. */}
      <MarkWhatsNewSeen />

      <ScreenBackHeader eyebrow={t("eyebrow")} className="screen-header-sticky" />

      <CenteredState fill className="items-stretch justify-start gap-4 px-5 pt-1.5 pb-10 text-left">
        <div className="flex flex-col gap-3.5 rounded-2xl bg-hero px-5.5 py-6">
          <AppMark size={52} tone="translucent" />
          <TextBlock
            titleSize="compact"
            tone="hero"
            spacing="tight"
            title={t("hero.title")}
            text={t("hero.text")}
          />
        </div>

        <VersionHeading name={t("v2.name")} date={t("v2.date")} pill={t("currentPill")} />
        <ListCard>
          <ListRow
            icon={<LockOpenIcon size={18} />}
            title={t("v2.account.title")}
            text={t("v2.account.text")}
          />
          <ListRow
            icon={<CalendarWeekIcon size={18} />}
            title={t("v2.screens.title")}
            text={t("v2.screens.text")}
          />
          <ListRow
            icon={<UserIcon size={18} />}
            title={t("v2.profile.title")}
            text={t("v2.profile.text")}
          />
          <ListRow
            divided={false}
            icon={<InfoCircleIcon size={18} />}
            title={t("v2.notifications.title")}
            text={t("v2.notifications.text")}
          />
        </ListCard>

        <VersionHeading name={t("v1.name")} date={t("v1.date")} pill={t("releasedPill")} />
        <ListCard>
          <ListRow
            icon={<LockClosedIcon size={18} />}
            title={t("v1.iosOnly.title")}
            text={t("v1.iosOnly.text")}
          />
          <ListRow
            icon={<CompassIcon size={18} />}
            title={t("v1.install.title")}
            text={t("v1.install.text")}
          />
          <ListRow
            icon={<CheckCircleIcon size={18} />}
            title={t("v1.waitlist.title")}
            text={t("v1.waitlist.text")}
          />
          <ListRow
            divided={false}
            icon={<WifiOffIcon size={18} />}
            title={t("v1.connection.title")}
            text={t("v1.connection.text")}
          />
        </ListCard>
      </CenteredState>
    </div>
  );
};
