import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSessionClaims } from "@/entities/session";
import { SignOutButton } from "@/features/sign-out";
import { createServerSupabaseClient } from "@/shared/api";
import { routes } from "@/shared/config";
import { hasRole } from "@/shared/lib/auth";
import { CenteredState } from "@/shared/ui/centered-state";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";
import { ProfileIcon } from "@/shared/ui/icons";
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

  // The only use of the role guard in v2 (ADR 0044): nothing branches on
  // the role, the screen just names it.
  const roleLabel = hasRole(claims, "admin") ? t("roleAdmin") : t("roleUser");

  return (
    <CenteredState fill className="items-stretch justify-start gap-6 px-5 pt-14 text-left">
      <Title>{t("title")}</Title>

      <ListCard>
        <ListRow
          divided={false}
          icon={<ProfileIcon size={18} />}
          title={profile?.display_name ?? t("nameUnknown")}
          text={roleLabel}
        />
      </ListCard>

      <nav aria-label={t("linksLabel")} className="flex gap-4 px-1">
        <TextLink href={routes.about}>{t("about")}</TextLink>
        <TextLink href={routes.privacy}>{t("privacy")}</TextLink>
      </nav>

      <SignOutButton label={t("signOut")} />
    </CenteredState>
  );
};
