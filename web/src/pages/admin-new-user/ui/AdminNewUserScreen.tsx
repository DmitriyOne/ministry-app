import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSessionClaims } from "@/entities/session";
import { ScreenBackHeader } from "@/features/screen-back";
import { routes } from "@/shared/config";
import { hasRole } from "@/shared/lib/auth";
import { BodyText } from "@/shared/ui/body-text";
import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";
import { CreateUserForm } from "@/widgets/create-user-form";

// The admin's screen for issuing credentials (D1: there is no
// registration, the owner hands accounts out).
//
// proxy.ts already refuses this path to anyone who is not an admin, and
// the Server Action checks the role again on its own. This third check is
// not redundancy for its own sake: each one protects a different thing —
// the proxy protects the navigation, the action protects the account
// table, and this one keeps the screen from rendering a form that the
// person reading it could never submit.
export const AdminNewUserScreen = async () => {
  const t = await getTranslations("screens.adminNewUser");
  const claims = await getSessionClaims();

  if (!claims) redirect(routes.login);
  if (!hasRole(claims, "admin")) redirect(routes.profile);

  return (
    // flex-1, not min-h-dvh: app/(with-bottom-nav)/layout.tsx already
    // reserves the viewport height and the room under the bar, and a
    // second min-h-dvh here adds that room on top of a full screen, so
    // the page scrolled by exactly the navigation's height for no reason.
    <div className="flex flex-1 flex-col bg-background text-ink">
      {/* sticky, like the about and privacy headers: this form is taller
          than the viewport with the keyboard open, and a back button that
          scrolls away is a back button you have to go looking for. `top`
          is the safe-area inset rather than 0, or it would pin itself
          under the status bar (viewport-fit=cover, ADR 0020). */}
      <ScreenBackHeader
        eyebrow={t("eyebrow")}
        className="sticky top-[env(safe-area-inset-top)] z-10 bg-background pt-[calc(--spacing(6)+env(safe-area-inset-top))]"
      />

      <CenteredState fill className="items-stretch justify-start gap-6 px-5 pt-2 text-left">
        <div className="flex flex-col gap-2 px-1">
          <Title>{t("title")}</Title>
          <BodyText>{t("subtitle")}</BodyText>
        </div>

        <CreateUserForm />
      </CenteredState>
    </div>
  );
};
