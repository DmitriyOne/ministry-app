import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { currentMonthKey, serviceYearOf, yearPath } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { routes } from "@/shared/config";

import { readTimeZone } from "../api/read-time-zone";
import { YearScreenFrame } from "./YearScreenFrame";

// What the bare /year is: the address that works out which service year
// the person is in and sends them to it — the arrangement /day and
// /month both have (ADR 0063, 0066), and here for the same reason. The
// navigation cannot know the year, because it depends on the person's
// own calendar, which is a row in the database.
//
// Nothing is rendered on the way through: `redirect` throws, so it is
// called outside any try/catch.
export const YearTodayRedirect = async () => {
  // proxy.ts already keeps this screen behind a session — except under
  // DEV_MODE, which switches the proxy off entirely. Without this the
  // read below runs as `anon`, the database answers "permission denied
  // for table profiles", and the screen says "could not load" at
  // somebody who simply is not signed in (ADR 0063, decision 12).
  if (!await getSessionClaims()) redirect(routes.login);

  const zone = await readTimeZone();

  if (zone.status === "ready") {
    redirect(yearPath(serviceYearOf(currentMonthKey(zone.timeZone))));
  }

  const t = await getTranslations("screens.year");

  // We do not know which service year this person is in, and the default
  // zone is not a safe guess: on the 1st of September it would open the
  // year that ended the day before.
  return (
    <YearScreenFrame>
      <ScreenLoadFailure
        eyebrow={t("eyebrow")}
        title={t("loadFailure.title")}
        text={t("loadFailure.text")}
      />
    </YearScreenFrame>
  );
};
