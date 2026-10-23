import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSessionClaims } from "@/entities/session";
import { PushNotificationsToggle } from "@/features/push-notifications";
import { SignOutButton } from "@/features/sign-out";
import { MinistryGoals } from "@/widgets/ministry-goals";
import { MinistryStatusSheet } from "@/widgets/ministry-status-sheet";
import { ProfileHero } from "@/widgets/profile-hero";
import { ProfileLinks } from "@/widgets/profile-links";
import { routes } from "@/shared/config";
import { hasRole } from "@/shared/lib/auth";
import { LinkButton } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { ListCard } from "@/shared/ui/list-card";

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
  const { displayName, hasUnreadWhatsNew, ministryStatus, yearGoalHours }
    = await readProfilePage();

  return (
    <CenteredState fill className="items-stretch justify-start gap-0 px-0 pt-2 pb-0 text-left">
      <ProfileHero displayName={displayName} isAdmin={isAdmin} status={ministryStatus} />

      <div className="flex flex-col gap-3 px-5 pt-4">
        <MinistryGoals status={ministryStatus} yearGoalHours={yearGoalHours} />

        {/* Above the notifications, because it is the one row here that
            changes what the rest of the app counts. */}
        <ListCard>
          <MinistryStatusSheet status={ministryStatus} />
        </ListCard>

        <ListCard>
          {/* Renders nothing in a browser tab or on a device without Web
              Push — iOS delivers it only to an installed app. */}
          <PushNotificationsToggle />
        </ListCard>

        <ProfileLinks hasUnreadWhatsNew={hasUnreadWhatsNew} />

        {/* Shown to an admin only. This is presentation, not protection:
            the path is gated in proxy.ts and the action checks the role
            again, so hiding the link is about not offering a door that
            would shut in your face. */}
        {isAdmin
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
