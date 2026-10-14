import { getTranslations } from "next-intl/server";

import { ScreenBackHeader } from "@/features/screen-back";
import { AppMark } from "@/shared/ui/app-mark";
import {
  CalendarWeekIcon,
  ChartArrowIcon,
  CompassIcon,
  LockClosedIcon,
  LockOpenIcon,
  CalendarMonthIcon,
  PlusIcon,
  UserIcon,
  TargetIcon,
  ChartBarIcon,
} from "@/shared/ui/icons";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";
import { PaceCard } from "@/shared/ui/pace-card";
import { SectionLabel } from "@/shared/ui/section-label";
import { TextBlock } from "@/shared/ui/text-block";

// /about — a single scrolling read-only screen: what the app is, what
// each screen does, what the headline features are. Reached only from
// the footer (ScreenFooter, widgets/screen-footer) on the screens that
// have one; never part of the launch flow itself (ADR 0029 explains why
// it's kept out of LaunchGate's APP_SCREEN_PATHS).
export const AboutScreen = async () => {
  const t = await getTranslations("screens.about");

  return (
    // `min-h-dvh` again: this screen left app/(with-footer) when the
    // footer was narrowed to /soon and /install (ADR 0029, amendment
    // 2026-10-08), so nothing above it reserves the viewport height any
    // more and it has to claim it itself — otherwise short content would
    // leave a pale strip of the page's background below it. The <main>
    // inside keeps `flex-1` and grows past that on long content, so the
    // document scrolls exactly as before.
    <div className="flex min-h-dvh flex-col bg-background text-ink">
      {/* The DOCUMENT is the scroll container here (no overflow-y-auto
          on <main> below), so `sticky` on this header is real: it pins
          to the top of the viewport as the page scrolls underneath it,
          not a no-op. (ADR 0031 originally removed `sticky` from this
          same header for the opposite — inner-scroll — layout; its
          amendment explains why it's back.) `bg-background` keeps
          content from showing through as it slides under the header;
          the padding-top override below adds the iOS safe-area inset
          (notch/status bar, `viewport-fit=cover` — ADR 0020) on top of
          the header's own `pt-6`, so the back button never sits under
          the status bar.
          Same classes as the Privacy screen — kept identical rather
          than factored into ScreenBackHeader itself, because not every
          future caller of that component will want a sticky header. */}
      <ScreenBackHeader
        eyebrow={t("eyebrow")}
        className="sticky top-0 z-10 bg-background pt-[calc(--spacing(6)+env(safe-area-inset-top))]"
      />

      <main className="flex flex-1 flex-col gap-4 px-5 pt-1.5 pb-10">
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

        <SectionLabel>{t("installLabel")}</SectionLabel>
        <ListCard>
          <ListRow
            divided={false}
            icon={<CompassIcon size={18} />}
            title={t("install.title")}
            text={t("install.text")}
          />
        </ListCard>

        <SectionLabel>{t("screensLabel")}</SectionLabel>
        <ListCard>
          <ListRow
            icon={<PlusIcon size={18} />}
            title={t("screens.day.title")}
            text={t("screens.day.text")}
          />
          <ListRow
            icon={<CalendarWeekIcon size={18} />}
            title={t("screens.calendar.title")}
            text={t("screens.calendar.text")}
          />
          <ListRow
            icon={<CalendarMonthIcon size={18} />}
            title={t("screens.month.title")}
            text={t("screens.month.text")}
          />
          <ListRow
            icon={<ChartBarIcon size={18} />}
            title={t("screens.year.title")}
            text={t("screens.year.text")}
          />
          <ListRow
            divided={false}
            icon={<UserIcon size={18} />}
            title={t("screens.profile.title")}
            text={t("screens.profile.text")}
          />
        </ListCard>

        <SectionLabel>{t("featuresLabel")}</SectionLabel>
        <PaceCard title={t("features.paceDeviation.title")} text={t("features.paceDeviation.text")} />
        <ListCard>
          <ListRow
            icon={<TargetIcon size={18} />}
            title={t("features.personalGoals.title")}
            text={t("features.personalGoals.text")}
          />
          <ListRow
            icon={<ChartArrowIcon size={18} />}
            title={t("features.beyondGoal.title")}
            text={t("features.beyondGoal.text")}
          />
          <ListRow
            icon={<LockOpenIcon size={18} />}
            title={t("features.accountSignIn.title")}
            text={t.rich("features.accountSignIn.text", {
              mail: (chunks) => <span className="text-primary">{chunks}</span>,
            })}
          />
          <ListRow
            divided={false}
            icon={<LockClosedIcon size={18} />}
            title={t("features.yourData.title")}
            text={t("features.yourData.text")}
          />
        </ListCard>
      </main>
    </div>
  );
};
