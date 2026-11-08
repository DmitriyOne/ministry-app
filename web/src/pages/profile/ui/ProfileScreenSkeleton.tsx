import { getTranslations } from "next-intl/server";

import { MinistryGoalsSkeleton } from "@/widgets/ministry-goals";
import { ProfileHeroSkeleton } from "@/widgets/profile-hero";
import { ProfileLinksSkeleton } from "@/widgets/profile-links";
import { ProfileTimeZoneSkeleton } from "@/widgets/profile-time-zone";
import { Button } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";
import { SectionLabel } from "@/shared/ui/section-label";
import { Skeleton } from "@/shared/ui/skeleton";

// What `/profile` shows while the server answers (app/(with-bottom-nav)/
// profile/loading.tsx re-exports it). It is not a waiting screen in the
// sense ADR 0055 rejected: nothing is hidden behind it, the navigation
// stays put because it lives in the layout, and what is drawn here is
// the screen itself with its unknowns greyed out.
//
// It composes the SAME widgets as the screen, each in its loading state,
// so the two cannot drift apart block by block. What is left here is the
// two rows that are not widgets: the notifications toggle and the way
// out.
//
// Only what the DATABASE has to answer gets a plate. Almost everything
// on this screen is dictionary text — every row title, the chevrons,
// "Sign out" — and it depends on nobody, so it is drawn for real and
// never moves when the data lands.
export const ProfileScreenSkeleton = async () => {
  const t = await getTranslations("screens.profile");

  // Resolved here rather than called inside the JSX: the lint rule that
  // forbids literal strings in markup only recognises `t` as a
  // dictionary lookup, and a second translator reads as a literal to it.
  // Naming the two strings is also plainer than a second `t` would be.
  const push = await getTranslations("notifications.push");
  const pushTitle = push("title");
  const pushDescription = push("description");

  return (
    // Deliberately the same classes as ProfileScreen's CenteredState: the
    // two are the same screen in two states, and any difference here
    // would show up as a jump at the moment the data arrives.
    <CenteredState fill className="items-stretch justify-start gap-0 px-0 pt-2 pb-0 text-left">
      <ProfileHeroSkeleton />

      <div className="flex flex-col gap-3 px-5 pt-4">
        <MinistryGoalsSkeleton />

        <ListCard>
          {/* The row the toggle will render. Its title and description
              come from the same dictionary keys the toggle itself uses,
              so the text does not change when it mounts — only the
              switch resolves. The one case this does not cover is a
              device where notifications were refused, whose description
              differs; the row is the right height either way. */}
          <ListRow
            title={pushTitle}
            text={pushDescription}
            trailing={<Skeleton className="h-8 w-13 shrink-0 rounded-full bg-ink-a09" />}
          />
        </ListCard>

        {/* The account card. Its one row carries no divider: a line
            under the last row of a card is a line for its own sake. */}
        <SectionLabel>{t("accountLabel")}</SectionLabel>
        <ListCard>
          <ProfileTimeZoneSkeleton divided={false} />
        </ListCard>

        <ProfileLinksSkeleton />

        {/* The admin's "New user" button is deliberately absent rather
            than reserved: whether it exists depends on a role nobody
            knows yet, and holding a gap for it would mean showing
            everyone a hole for the sake of one person. It appears with
            the data, pushing "Sign out" down a little, and that is the
            cheaper of the two costs.

            A real button, disabled, rather than a plate: it is the right
            height by construction, and "you cannot sign out yet" is the
            truth for the moment it is on screen. */}
        <Button variant="plain" size="role-lg" isDisabled>
          {t("signOut")}
        </Button>
      </div>
    </CenteredState>
  );
};
