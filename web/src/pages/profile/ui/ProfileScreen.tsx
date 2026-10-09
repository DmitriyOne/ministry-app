import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSessionClaims } from "@/entities/session";
import { SignOutButton } from "@/features/sign-out";
import { createServerSupabaseClient } from "@/shared/api";
import { routes } from "@/shared/config";
import { hasRole } from "@/shared/lib/auth";
import { getInitials } from "@/shared/lib/display-name";
import { LinkButton } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";
import { TextLink } from "@/shared/ui/text-link";
import { Title } from "@/shared/ui/title";

export const ProfileScreen = async () => {
  const t = await getTranslations("screens.profile");
  const claims = await getSessionClaims();

  // proxy.ts already keeps this screen behind a session, so this line
  // should be unreachable. It is here because a screen that reads an
  // identity must not depend on a gate above it still being correct —
  // the cost is one comparison, the alternative is rendering a profile
  // for nobody.
  if (!claims) redirect(routes.login);

  // Read under the person's own session: the "read own profile" policy
  // (ADR 0043) allows exactly this row, so no id filter is needed. A
  // failed read leaves the name out rather than failing the screen —
  // the role and the way out are the parts that matter here.
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from("profiles").select("display_name").maybeSingle();

  const displayName = profile?.display_name ?? "";
  // Empty when the profile read failed or the name is blank; then the
  // badge shows nothing rather than a stray letter from a fallback
  // string, and the row still reads correctly.
  const initials = getInitials(displayName);

  // The only use of the role guard in v2 (ADR 0044): nothing branches on
  // the role, the screen just names it.
  const isAdmin = hasRole(claims, "admin");
  const roleLabel = isAdmin ? t("roleAdmin") : t("roleUser");

  return (
    <CenteredState fill className="items-stretch justify-start gap-6 px-5 pt-14 text-left">
      <Title>{t("title")}</Title>

      <ListCard>
        <ListRow
          divided={false}
          // Letters from the name instead of a generic figure: there are
          // no uploaded pictures in this app, and one person's badge
          // should not look like everyone else's.
          icon={<span className="text-caption font-620 text-ink">{initials}</span>}
          title={displayName || t("nameUnknown")}
          text={roleLabel}
        />
      </ListCard>

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

      <nav aria-label={t("linksLabel")} className="flex gap-4 px-1">
        <TextLink href={routes.about}>{t("about")}</TextLink>
        <TextLink href={routes.privacy}>{t("privacy")}</TextLink>
      </nav>

      <SignOutButton label={t("signOut")} />
    </CenteredState>
  );
};
