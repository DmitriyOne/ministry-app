import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSessionClaims } from "@/entities/session";
import { PushNotificationsToggle } from "@/features/push-notifications";
import { SignOutButton } from "@/features/sign-out";
import { WhatsNewUnreadDot } from "@/features/whats-new";
import { createServerSupabaseClient } from "@/shared/api";
import { APP_VERSION, hasUnreadVersion, routes } from "@/shared/config";
import { hasRole } from "@/shared/lib/auth";
import { getInitials } from "@/shared/lib/display-name";
import { LinkButton } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, whats_new_seen")
    .maybeSingle();

  const displayName = profile?.display_name ?? "";
  // Empty when the profile read failed or the name is blank; then the
  // badge shows nothing rather than a stray letter from a fallback
  // string, and the row still reads correctly.
  const initials = getInitials(displayName);

  // The dot on the What's New row, lit when this person has opened that
  // screen for nothing, or for a version older than the one running.
  //
  // A profile that did not load is a separate case and gets no dot: it
  // means the read failed, not that there is news, and a database problem
  // should not reach the screen as a claim about new features.
  //
  // The known cost of keying this to the whole version is in ADR 0057: a
  // release with nothing worth reading lights the dot as well.
  const hasUnreadWhatsNew = profile
    ? hasUnreadVersion(profile.whats_new_seen, APP_VERSION)
    : false;

  // The only use of the role guard in v2 (ADR 0044): nothing branches on
  // the role, the screen just names it.
  const isAdmin = hasRole(claims, "admin");
  const roleLabel = isAdmin ? t("roleAdmin") : t("roleUser");

  return (
    <CenteredState fill className="items-stretch justify-start gap-0 px-0 pt-2 pb-0 text-left">
      {/* Variant A1 of the profile mockups: the top of the screen is the
          person, not a list row. A plain div, not <header> — CenteredState
          already gives the screen its <main>, and <header> is reserved for
          navigation (CLAUDE.md). */}
      <div className="mx-3 flex flex-col gap-3.5 rounded-4xl bg-hero px-5 pt-6 pb-5.5 text-hero-foreground">
        <Eyebrow as="span" className="text-positive-hero">{t("title")}</Eyebrow>

        {/* Letters from the name instead of a generic figure: there are no
            uploaded pictures in this app, and one person's badge should not
            look like everyone else's. Decorative — the name is right under
            it, so a screen reader would only say it twice. */}
        <span
          aria-hidden="true"
          className="flex size-18 items-center justify-center rounded-full bg-white/10 text-day-title font-620"
        >
          {initials}
        </span>

        <div className="flex flex-col gap-2">
          <Title tone="hero">{displayName || t("nameUnknown")}</Title>
          {/* Mint on deep green — the one place the palette allows it
              (ADR 0011). */}
          <span className="self-start rounded-sm bg-white/10 px-3 py-1.5 text-caption font-600 text-positive-hero">
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4">
        <ListCard>
          {/* Renders nothing in a browser tab or on a device without Web
              Push — iOS delivers it only to an installed app. */}
          <PushNotificationsToggle />
        </ListCard>

        <nav aria-label={t("linksLabel")}>
          <ListCard>
            <ListRow
              href={routes.whatsNew}
              title={t("whatsNew")}
              trailing={(
                <span className="flex shrink-0 items-center gap-2.5">
                  {/* A client island, not a span, because it has to be able
                      to disagree with the server: this screen comes back
                      from the router's cache on a back navigation without
                      being re-rendered, so the dot has to check locally
                      whether this device has already been shown the
                      release (features/whats-new). */}
                  <WhatsNewUnreadDot
                    unread={hasUnreadWhatsNew}
                    label={t("whatsNewUnread")}
                  />
                  <ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />
                </span>
              )}
            />
            <ListRow
              href={routes.about}
              title={t("about")}
              trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
            />
            <ListRow
              href={routes.privacy}
              title={t("privacy")}
              divided={false}
              trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
            />
          </ListCard>
        </nav>

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
