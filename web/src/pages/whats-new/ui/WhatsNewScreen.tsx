import { getTranslations } from "next-intl/server";

import { ScreenBackHeader } from "@/features/screen-back";
import { MarkWhatsNewSeen } from "@/features/whats-new";
import { AppMark } from "@/shared/ui/app-mark";
import { CenteredState } from "@/shared/ui/centered-state";
// Seven of these are stand-ins. The set has no bell, no phone, no
// envelope and no eye-on-a-list, and adding icons is the owner's call,
// not a detail to slip into a screen: notifications borrow the info
// circle, "iPhone only" borrows the closed lock (it is a restriction),
// the waiting list borrows the tick, and this page itself borrows the
// eye — the glyph the password field uses for "see it". Install uses
// the compass deliberately — the same glyph /about gives that row. The
// 2.1's single row borrows the target: the set has nothing for a tap
// landing under a finger, and that is the closest honest stand-in. The
// 2.0.1 rows borrow as well: the tick for a fix that landed, the warning
// circle — the same one the new "something's wrong on our side" screen
// shows, which is the point of that row — and the closed lock for
// signing out, since that is what leaving does.
//
// The 2.3 rows borrow nothing: each one wears the glyph its own screen
// wears. Plus is the hours card's own button, the left chevron is the
// step back a day, the week is the same calendar the menu shows, and the
// rising chart is the progress block.
import {
  AlertCircleIcon,
  CalendarMonthIcon,
  CalendarWeekIcon,
  ChartArrowIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  CompassIcon,
  EyeIcon,
  InfoCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  PlusIcon,
  TargetIcon,
  UserIcon,
  WifiOffIcon,
} from "@/shared/ui/icons";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";
import { TextBlock } from "@/shared/ui/text-block";

import { VersionHeading } from "./VersionHeading";

// The release history people see, in the same frame as /about and
// /privacy: sticky back header, green hero block, cards of rows. The
// versions are written out rather than driven by a list, because each
// one's rows are different prose — a loop over
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

        {/* The release the hours card had been waiting for since 2.1,
            which is why "your hours are kept" leads: until now the card
            dialled a number into React state and a reload put it back to
            zero (ADR 0060/0062), and 2.1 deliberately announced only the
            tick under the finger rather than a promise the app did not
            keep. The other three rows are what the day screen gained
            around it — a day per address, the progress block, the strip
            (ADR 0063/0064/0065). */}
        {/* 2.4 is about one question and three answers to things people
            ran into: when the pioneering began (without it the year
            could not add up), whose figure the year's goal is, and two
            rough edges — the day screen flickering on the way in, and a
            refusal on the sign-in drawn as a thin outline.

            The glyphs: the month for a question about months, the
            target for the year's goal (the same one 2.1 and 2.2 use for
            aiming at something), the tick for a fix that landed, and the
            warning circle for the message that carries it. */}
        {/* The glyphs: the month for the screen it is about, the bars
            for a figure that accumulates, and the two locks for the two
            halves of closing — shut and open again. */}
        <VersionHeading name={t("v2_5.name")} date={t("v2_5.date")} pill={t("currentPill")} />
        <ListCard>
          <ListRow
            icon={<CalendarMonthIcon size={18} />}
            title={t("v2_5.monthScreen.title")}
            text={t("v2_5.monthScreen.text")}
          />
          <ListRow
            icon={<ChartArrowIcon size={18} />}
            title={t("v2_5.pace.title")}
            text={t("v2_5.pace.text")}
          />
          <ListRow
            icon={<ChartBarIcon size={18} />}
            title={t("v2_5.runningTotal.title")}
            text={t("v2_5.runningTotal.text")}
          />
          <ListRow
            icon={<LockClosedIcon size={18} />}
            title={t("v2_5.closeMonth.title")}
            text={t("v2_5.closeMonth.text")}
          />
          <ListRow
            divided={false}
            icon={<LockOpenIcon size={18} />}
            title={t("v2_5.reopenMonth.title")}
            text={t("v2_5.reopenMonth.text")}
          />
        </ListCard>

        <VersionHeading name={t("v2_4.name")} date={t("v2_4.date")} pill={t("releasedPill")} />
        <ListCard>
          <ListRow
            icon={<CalendarMonthIcon size={18} />}
            title={t("v2_4.pioneerStart.title")}
            text={t("v2_4.pioneerStart.text")}
          />
          <ListRow
            icon={<TargetIcon size={18} />}
            title={t("v2_4.yearGoal.title")}
            text={t("v2_4.yearGoal.text")}
          />
          <ListRow
            icon={<UserIcon size={18} />}
            title={t("v2_4.afterAuxiliary.title")}
            text={t("v2_4.afterAuxiliary.text")}
          />
          <ListRow
            icon={<CheckCircleIcon size={18} />}
            title={t("v2_4.dayOpens.title")}
            text={t("v2_4.dayOpens.text")}
          />
          <ListRow
            divided={false}
            icon={<AlertCircleIcon size={18} />}
            title={t("v2_4.signInError.title")}
            text={t("v2_4.signInError.text")}
          />
        </ListCard>

        <VersionHeading name={t("v2_3.name")} date={t("v2_3.date")} pill={t("releasedPill")} />
        <ListCard>
          <ListRow
            icon={<PlusIcon size={18} />}
            title={t("v2_3.hours.title")}
            text={t("v2_3.hours.text")}
          />
          <ListRow
            icon={<ChevronLeftIcon size={18} />}
            title={t("v2_3.anyDay.title")}
            text={t("v2_3.anyDay.text")}
          />
          <ListRow
            icon={<ChartArrowIcon size={18} />}
            title={t("v2_3.progress.title")}
            text={t("v2_3.progress.text")}
          />
          <ListRow
            divided={false}
            icon={<CalendarWeekIcon size={18} />}
            title={t("v2_3.lastDays.title")}
            text={t("v2_3.lastDays.text")}
          />
        </ListCard>

        {/* The first release where the app learns something ABOUT the
            person rather than only showing them screens: how they serve,
            and what they are aiming for. The third row is here because
            "from next month" is the one rule that would otherwise be
            discovered by surprise. */}
        <VersionHeading name={t("v2_2.name")} date={t("v2_2.date")} pill={t("releasedPill")} />
        <ListCard>
          <ListRow
            icon={<UserIcon size={18} />}
            title={t("v2_2.status.title")}
            text={t("v2_2.status.text")}
          />
          <ListRow
            icon={<TargetIcon size={18} />}
            title={t("v2_2.goal.title")}
            text={t("v2_2.goal.text")}
          />
          <ListRow
            divided={false}
            icon={<CalendarMonthIcon size={18} />}
            title={t("v2_2.changeAnyTime.title")}
            text={t("v2_2.changeAnyTime.text")}
          />
        </ListCard>

        {/* One row, on purpose. That release also put the hours card on
            the day screen, and that card saves nothing: a reload clears
            it (ADR 0060). Announcing "you can record your hours" would be
            a promise the app does not keep yet, so this version says only
            the part that is true for good — the tick under the finger. */}
        <VersionHeading name={t("v2_1.name")} date={t("v2_1.date")} pill={t("releasedPill")} />
        <ListCard>
          <ListRow
            divided={false}
            icon={<TargetIcon size={18} />}
            title={t("v2_1.haptics.title")}
            text={t("v2_1.haptics.text")}
          />
        </ListCard>

        {/* A patch release, and it says so plainly: two fixes, no new
            abilities. It gets a block of its own because raising the
            version lights the dot on the profile either way (the known
            defect in ADR 0057), and a dot that leads to nothing new to
            read is worse than the fix it announces. */}
        <VersionHeading
          name={t("v2_0_1.name")}
          date={t("v2_0_1.date")}
          pill={t("releasedPill")}
        />
        <ListCard>
          <ListRow
            icon={<CheckCircleIcon size={18} />}
            title={t("v2_0_1.flicker.title")}
            text={t("v2_0_1.flicker.text")}
          />
          <ListRow
            icon={<AlertCircleIcon size={18} />}
            title={t("v2_0_1.ourFault.title")}
            text={t("v2_0_1.ourFault.text")}
          />
          <ListRow
            icon={<UserIcon size={18} />}
            title={t("v2_0_1.profileOpens.title")}
            text={t("v2_0_1.profileOpens.text")}
          />
          <ListRow
            divided={false}
            icon={<LockClosedIcon size={18} />}
            title={t("v2_0_1.signOut.title")}
            text={t("v2_0_1.signOut.text")}
          />
        </ListCard>

        <VersionHeading name={t("v2.name")} date={t("v2.date")} pill={t("releasedPill")} />
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
            icon={<InfoCircleIcon size={18} />}
            title={t("v2.notifications.title")}
            text={t("v2.notifications.text")}
          />
          {/* The screen describing itself, last in its own version: it is
              the one row a person can act on by simply being here. */}
          <ListRow
            divided={false}
            icon={<EyeIcon size={18} />}
            title={t("v2.thisPage.title")}
            text={t("v2.thisPage.text")}
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
