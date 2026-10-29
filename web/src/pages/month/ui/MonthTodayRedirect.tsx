import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { currentMonthKey, monthPath } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { routes } from "@/shared/config";
import { CenteredState } from "@/shared/ui/centered-state";

import { readTimeZone } from "../api/read-time-zone";

// What the bare /month is: the address that works out which month the
// person is in and sends them to it — the same arrangement /day has
// (ADR 0063), and here for the same reason. The navigation cannot know
// the month, because it depends on the person's own calendar, which is
// a row in the database.
//
// Nothing is rendered on the way through: `redirect` throws, so it is
// called outside any try/catch.
export const MonthTodayRedirect = async () => {
  // proxy.ts already keeps this screen behind a session — except under
  // DEV_MODE, which switches the proxy off entirely. Without this the
  // read below runs as `anon`, the database answers "permission denied
  // for table profiles", and the screen says "could not load" at
  // somebody who simply is not signed in (ADR 0063, decision 12).
  if (!await getSessionClaims()) redirect(routes.login);

  const zone = await readTimeZone();

  if (zone.status === "ready") redirect(monthPath(currentMonthKey(zone.timeZone)));

  const t = await getTranslations("screens.month");

  // We do not know which month this person is in, and the default zone
  // is not a safe guess: on the last day of a month it would open the
  // wrong one and offer to close it.
  return (
    <CenteredState fill>
      <ScreenLoadFailure
        eyebrow={t("eyebrow")}
        title={t("loadFailure.title")}
        text={t("loadFailure.text")}
      />
    </CenteredState>
  );
};
