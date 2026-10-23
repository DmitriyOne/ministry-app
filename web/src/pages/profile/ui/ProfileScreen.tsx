import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  currentMonthKey,
  resolveStatusForMonth,
  SERVICE_YEAR_FIRST_MONTH,
  serviceYearGoalHours,
  serviceYearOf,
  toMinistryStatusRows,
  toMonthKey,
} from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { PushNotificationsToggle } from "@/features/push-notifications";
import { SignOutButton } from "@/features/sign-out";
import { WhatsNewUnreadDot } from "@/features/whats-new";
import { MinistryStatusSheet } from "@/widgets/ministry-status-sheet";
import { createServerSupabaseClient } from "@/shared/api";
import { APP_VERSION, hasUnreadVersion, routes } from "@/shared/config";
import { hasRole } from "@/shared/lib/auth";
import { getInitials } from "@/shared/lib/display-name";
import { LinkButton } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { GoalCard } from "@/shared/ui/goal-card";
import { HeroPill } from "@/shared/ui/hero-pill";
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
    .select("display_name, whats_new_seen, time_zone")
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

  // Which month this person is in, in their own calendar (ADR 0061). The
  // zone is read from the profile; nothing writes it yet, so it is the
  // Europe/London default for everybody — the cost is named in the ADR,
  // and this line is where it will stop costing anything once there is a
  // screen for changing it.
  const currentMonth = currentMonthKey(profile?.time_zone);
  const serviceYear = serviceYearOf(currentMonth);
  // August, said as "the month before the one a service year starts in",
  // so this line follows if that boundary ever moves.
  const yearEndsIn = toMonthKey(serviceYear + 1, SERVICE_YEAR_FIRST_MONTH - 1);

  // ONE read for both answers. The status in force this month and the
  // goal for the whole service year come from the same rows, through the
  // same rule (ADR 0061, decision 5) — a second query would be a second
  // chance for the pill and the cards to disagree with each other.
  //
  // No lower bound: a status chosen two years ago and never changed is
  // what the start of this year reads from, so the rows BEFORE September
  // are part of the answer. There is one row per change, not per month,
  // so this stays small.
  //
  // Null is the read having failed, and then neither the pill nor the
  // cards are drawn: "Publisher, no goal" is a statement about the
  // person, not a safe fallback for a query that did not answer.
  const rows = toMinistryStatusRows(
    await supabase
      .from("ministry_status_months")
      .select("month, status, duration, monthly_goal_hours")
      .lte("month", yearEndsIn)
      .order("month"),
  );

  const ministryStatus = rows ? resolveStatusForMonth(rows, currentMonth) : null;

  // A dash, not a zero: "no goal at all" is an answer a publisher may
  // give, and a goal of zero hours would be a different claim. The
  // year's total is zero in exactly the same case — every month of it
  // had no goal — so both read through here.
  const goalLabel = (hours: number | null) =>
    hours === null || hours === 0 ? t("goals.noGoal") : t("goals.hours", { hours });

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
          {/* Two pills, role and ministry status, in that order; the
              status takes the filled tone because it is what a person
              came here to check. They wrap rather than shrink, because
              "Regular auxiliary pioneer" is the longest label in the
              app. */}
          <div className="flex flex-wrap items-center gap-2">
            <HeroPill>{roleLabel}</HeroPill>
            {ministryStatus
              ? <HeroPill tone="filled">{t(`ministryStatus.${ministryStatus.status}`)}</HeroPill>
              : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4">
        {/* The two numbers the status produces, directly under the
            person they belong to. A description list, not two divs: the
            pair is two terms and their values, and it reads as "Monthly
            goal, 30 hours" instead of four loose lines.

            The year is the sum of its twelve monthly goals and is stored
            nowhere (ADR 0061, decision 5), so a pioneer appointed in
            November sees the truth about their year — 500 — rather than
            a stored 600 that would show them behind from the first day
            to the last. */}
        {ministryStatus
          ? (
              <dl className="grid grid-cols-2 gap-3">
                <GoalCard
                  tone="primary"
                  label={t("goals.month")}
                  value={goalLabel(ministryStatus.monthlyGoalHours)}
                />
                <GoalCard
                  tone="deep"
                  label={t("goals.year")}
                  value={goalLabel(rows ? serviceYearGoalHours(rows, serviceYear) : null)}
                />
              </dl>
            )
          : null}

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
