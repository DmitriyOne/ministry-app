import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSessionClaims } from "@/entities/session";
import { PushNotificationsToggle } from "@/features/push-notifications";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { SignOutButton } from "@/features/sign-out";
import { MinistryGoals } from "@/widgets/ministry-goals";
import { MinistryStatusSheet } from "@/widgets/ministry-status-sheet";
import { ProfileHero } from "@/widgets/profile-hero";
import { ProfileLinks } from "@/widgets/profile-links";
import { ProfileTimeZone } from "@/widgets/profile-time-zone";
import { routes } from "@/shared/config";
import { hasRole } from "@/shared/lib/auth";
import { LinkButton } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { ListCard } from "@/shared/ui/list-card";
import { SectionLabel } from "@/shared/ui/section-label";

import { readProfilePage } from "../api/read-profile-page";

// The screen is composition and nothing else: who is asking, what the
// database says, and in which order the blocks sit. Every query lives in
// `../api/read-profile-page`, and every block that has a shape of its
// own is a widget that also owns its skeleton.
export const ProfileScreen = async () => {
  const t = await getTranslations("screens.profile");
  const claims = await getSessionClaims();

  // proxy.ts already keeps this screen behind a session, so this line
  // should be unreachable. It is here because a screen that reads an
  // identity must not depend on a gate above it still being correct —
  // the cost is one comparison, the alternative is rendering a profile
  // for nobody.
  if (!claims) redirect(routes.login);

  // The only use of the role guard in v2 (ADR 0044): nothing branches on
  // the role beyond naming it and offering one extra door.
  const isAdmin = hasRole(claims, "admin");
  const page = await readProfilePage();
  const loaded = page.status === "ready";

  return (
    <CenteredState fill className="items-stretch justify-start gap-0 px-0 pt-2 pb-0 text-left">
      {/* The header carries a name, a role and a ministry status, and
          only the role comes from the token. So a profile that did not
          load gets no header at all: drawn from what is left, it said
          "Your account" beside a real role — a page that looks like
          somebody's profile and is nobody's (the owner, 2026-10-23).
          The way out and the links stay, because they need no data and
          they are what a person comes here for when nothing works. */}
      {loaded
        ? <ProfileHero displayName={page.displayName} isAdmin={isAdmin} status={page.ministryStatus} />
        : null}

      <div className="flex flex-col gap-3 px-5 pt-4">
        {loaded
          ? (
              <>
                <MinistryGoals
                  status={page.ministryStatus}
                  yearGoalHours={page.yearGoalHours}
                />

                {/* Above the notifications, because it is the one row here
                    that changes what the rest of the app counts. */}
                <ListCard>
                  <MinistryStatusSheet
                    status={page.ministryStatus}
                    pioneeringSinceYearStart={page.pioneeringSinceYearStart}
                  />
                </ListCard>
              </>
            )
          : (
              // One filled card instead of those two blocks, the same
              // answer /day gives when it cannot read the day's hours:
              // say it did not load rather than show a status nobody
              // confirmed and a sheet that would write against it. Deep
              // green, not a white plate and not the lighter --primary:
              // the owner compared the mock-ups and took the fill of
              // "header says it" (2026-10-26), which is also what /day
              // wears, so a failure looks the same wherever it lands.
              <ScreenLoadFailure
                title={t("loadFailure.title")}
                text={t("loadFailure.text")}
              />
            )}

        {/* The toggle renders nothing in a browser tab or on a device
            without Web Push — iOS delivers it only to an installed app —
            and its position comes from the browser rather than from us.
            It is still dropped when the read failed: switching it needs
            the server that just did not answer, so it would be a control
            that looks live and refuses (the owner, 2026-10-26). */}
        {loaded
          ? (
              <ListCard>
                <PushNotificationsToggle />
              </ListCard>
            )
          : null}

        {/* Which calendar the app counts in — read-only, and that is
            the point of showing it at all (ADR 0061, update 2026-11-07).
            Under a section label, in a card of its own for now: the
            label is what makes the row a statement about the account
            rather than a setting that lost its switch.

            Dropped when the read failed, like everything else here that
            states a fact about this person. */}
        {loaded
          ? (
              <>
                <SectionLabel>{t("accountLabel")}</SectionLabel>
                <ListCard>
                  <ProfileTimeZone timeZone={page.timeZone} divided={false} />
                </ListCard>
              </>
            )
          : null}

        {/* The unread dot is the only part of this that needs the
            database, and a profile that did not load gets none: that
            means the read failed, not that there is something to read. */}
        <ProfileLinks hasUnreadWhatsNew={loaded && page.hasUnreadWhatsNew} />

        {/* Shown to an admin only. This is presentation, not protection:
            the path is gated in proxy.ts and the action checks the role
            again, so hiding the link is about not offering a door that
            would shut in your face. */}
        {isAdmin && loaded
          ? (
              <LinkButton href={routes.adminNewUser} variant="action" size="role-lg">
                {t("newUser")}
              </LinkButton>
            )
          : null}

        <SignOutButton
          label={t("signOut")}
          confirm={{
            title: t("signOutConfirm.title"),
            body: t("signOutConfirm.body"),
            confirm: t("signOutConfirm.confirm"),
            cancel: t("signOutConfirm.cancel"),
          }}
        />
      </div>
    </CenteredState>
  );
};
