import { getTranslations } from "next-intl/server";

import type { EffectiveMinistryStatus } from "@/entities/ministry-status";
import { getInitials } from "@/shared/lib/display-name";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { HeroPill } from "@/shared/ui/hero-pill";
import { Title } from "@/shared/ui/title";

type ProfileHeroProps = {
  displayName: string;
  isAdmin: boolean;
  // Null when the read failed: the status pill is then left out
  // entirely rather than naming a status nobody confirmed.
  status: EffectiveMinistryStatus | null;
};

// The top of /profile: who this is, in what role, on what ministry
// status. Variant A1 of the profile mockups — the screen opens with the
// person, not with a list row.
//
// A server component with no state at all. It is a widget rather than
// markup inside the screen because it is a block with a shape of its
// own: a deep-green card that other screens may well want, and a
// skeleton that has to stay the same size as it (ProfileHeroSkeleton,
// beside this file — the two are one thing in two states, and keeping
// them apart is how they drift).
export const ProfileHero = async ({ displayName, isAdmin, status }: ProfileHeroProps) => {
  const t = await getTranslations("screens.profile");

  return (
    // A plain div, not <header> — CenteredState already gives the screen
    // its <main>, and <header> is reserved for navigation (CLAUDE.md).
    <div className="mx-3 flex flex-col gap-3.5 rounded-4xl bg-hero px-5 pt-6 pb-5.5 text-hero-foreground">
      <Eyebrow as="span" className="text-positive-hero">{t("title")}</Eyebrow>

      {/* Letters from the name instead of a generic figure: there are no
          uploaded pictures in this app, and one person's badge should
          not look like everyone else's. Decorative — the name is right
          under it, so a screen reader would only say it twice. */}
      <span
        aria-hidden="true"
        className="flex size-18 items-center justify-center rounded-full bg-white/10 text-day-title font-620"
      >
        {getInitials(displayName)}
      </span>

      <div className="flex flex-col gap-2">
        <Title tone="hero">{displayName || t("nameUnknown")}</Title>
        {/* Two pills, role and ministry status, in that order; the
            status takes the filled tone because it is what a person came
            here to check. They wrap rather than shrink, because "Regular
            auxiliary pioneer" is the longest label in the app. */}
        <div className="flex flex-wrap items-center gap-2">
          <HeroPill>{isAdmin ? t("roleAdmin") : t("roleUser")}</HeroPill>
          {status
            ? <HeroPill tone="filled">{t(`ministryStatus.${status.status}`)}</HeroPill>
            : null}
        </div>
      </div>
    </div>
  );
};
