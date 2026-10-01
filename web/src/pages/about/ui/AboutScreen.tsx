import { getTranslations } from "next-intl/server";

import { ScreenBackHeader } from "@/features/screen-back";
import { AppMark } from "@/shared/ui/app-mark";
import {
  CalendarIcon,
  ChartArrowIcon,
  LockClosedIcon,
  LockOpenIcon,
  MonthIcon,
  PlusIcon,
  ProfileIcon,
  TargetIcon,
  YearIcon,
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
    <div className="flex min-h-dvh flex-col bg-background text-ink">
      <ScreenBackHeader eyebrow={t("eyebrow")} />

      {/* No `sticky` on the header above and none needed: this <main>,
          not the document, is the scroll container (flex-1 +
          overflow-y-auto), so the header sits outside its scroll flow
          and is already permanently visible without `position: sticky`
          doing anything (same structure as the Privacy screen, ADR
          0031). */}
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1.5 pb-10">
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

        <SectionLabel>{t("screensLabel")}</SectionLabel>
        <ListCard>
          <ListRow
            icon={<PlusIcon size={18} />}
            title={t("screens.day.title")}
            text={t("screens.day.text")}
          />
          <ListRow
            icon={<CalendarIcon size={18} />}
            title={t("screens.calendar.title")}
            text={t("screens.calendar.text")}
          />
          <ListRow
            icon={<MonthIcon size={18} />}
            title={t("screens.month.title")}
            text={t("screens.month.text")}
          />
          <ListRow
            icon={<YearIcon size={18} />}
            title={t("screens.year.title")}
            text={t("screens.year.text")}
          />
          <ListRow
            divided={false}
            icon={<ProfileIcon size={18} />}
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
