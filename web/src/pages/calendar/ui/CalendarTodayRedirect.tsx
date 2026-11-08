import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { calendarPath, currentMonthKey } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { routes } from "@/shared/config";

import { readTimeZone } from "../api/read-time-zone";
import { CalendarScreenFrame } from "./CalendarScreenFrame";

// What the bare /calendar is: the address that works out which month the
// person is in and sends them to it — the arrangement /day, /month and
// /year all have (ADR 0063, 0066, 0067). The navigation cannot know the
// month, because it depends on the person's own calendar, which is a row
// in the database.
//
// Nothing is rendered on the way through: `redirect` throws, so it is
// called outside any try/catch.
export const CalendarTodayRedirect = async () => {
  // proxy.ts already keeps this screen behind a session — except under
  // DEV_MODE, which switches the proxy off entirely. Without this the
  // read below runs as `anon`, the database answers "permission denied
  // for table profiles", and the screen says "could not load" at
  // somebody who simply is not signed in (ADR 0063, decision 12).
  if (!await getSessionClaims()) redirect(routes.login);

  const zone = await readTimeZone();

  if (zone.status === "ready") redirect(calendarPath(currentMonthKey(zone.timeZone)));

  const t = await getTranslations("screens.calendar");

  // We do not know which month this person is in, and the default zone
  // is not a safe guess: on the 1st it would open the month that ended
  // the day before.
  return (
    <CalendarScreenFrame>
      <ScreenLoadFailure
        eyebrow={t("eyebrow")}
        title={t("loadFailure.title")}
        text={t("loadFailure.text")}
      />
    </CalendarScreenFrame>
  );
};
