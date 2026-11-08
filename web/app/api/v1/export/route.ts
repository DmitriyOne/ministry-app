import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { currentDayKey } from "@/entities/ministry-day";
import { getSessionClaims } from "@/entities/session";
import {
  buildExportDayRows,
  buildExportMonthRows,
  buildXlsx,
  EXPORT_CONTENT_TYPE,
  type ExportFormat,
  exportFileName,
  parseExportFormat,
  readExportDays,
  toCsv,
} from "@/features/export-data";
import { DEFAULT_TIME_ZONE } from "@/shared/lib/time-zone";

// Hands the person their own data as a file (ADR 0071).
//
// A Route Handler rather than a Server Action, because the answer IS the
// file: an attachment with a Content-Disposition, which the browser saves
// without any client code of ours running. A Server Action would have to
// return bytes to a client component, which would then build a blob and
// click an invisible link — more moving parts, and every one of them a
// thing that can fail on a phone.
//
// `nodejs` is already the default runtime; it is named here because the
// xlsx writer reaches for `node:stream` and a future edge default would
// break this route and nothing else.
export const runtime = "nodejs";

// A Server Action and a Route Handler are both public endpoints,
// reachable by anyone who can craft the request — proxy.ts classifies by
// exact pathname and leaves /api alone, so this check is not a second
// opinion, it is the only one.
export const GET = async (request: NextRequest) => {
  if (!await getSessionClaims()) {
    return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const format: ExportFormat | null
    = parseExportFormat(request.nextUrl.searchParams.get("format"));

  // 400 rather than a default format: a guess would hand somebody a .csv
  // when they asked for a spreadsheet, and the file would be the only
  // place that said so.
  if (format === null) {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const read = await readExportDays();

  // 503, and no partial file. The read already reported why (Sentry plus
  // a log line); what matters here is that a download either contains
  // everything or does not happen, because a file with a silent hole in
  // it outlives every explanation.
  if (read.status === "unavailable") {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const t = await getTranslations("screens.profile.export");
  const days = buildExportDayRows(read.rows);
  const months = buildExportMonthRows(days);

  // The date in the file's NAME, which is a label rather than data: the
  // app's default calendar is the one every profile carries today
  // (nothing writes profiles.time_zone — the row above this card on
  // /profile says so), and a name that is a few hours out at a day
  // boundary changes what the file is called, not what is in it. When
  // the zone becomes writable this becomes a real read of it.
  const fileName = exportFileName(format, currentDayKey(DEFAULT_TIME_ZONE));

  const body = format === "csv"
    ? toCsv([
        [t("date"), t("weekday"), t("hours"), t("minutes"), t("month"), t("serviceYear")],
        ...days.map((day) =>
          [day.day, day.weekday, day.hours, day.minutes, day.month, day.serviceYear]),
      ])
    // A Uint8Array rather than the Buffer itself: both are valid bodies
    // at runtime, and this is the one the Response types name.
    : new Uint8Array(await buildXlsx(days, months, {
        daysSheet: t("daysSheet"),
        monthsSheet: t("monthsSheet"),
        date: t("date"),
        weekday: t("weekday"),
        hours: t("hours"),
        minutes: t("minutes"),
        month: t("month"),
        serviceYear: t("serviceYear"),
        daysRecorded: t("daysRecorded"),
      }));

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": EXPORT_CONTENT_TYPE[format],
      // ASCII, no spaces (model/export-format.ts), so the plain form of
      // this header is enough and the RFC 5987 encoding is not needed.
      "Content-Disposition": `attachment; filename="${fileName}"`,
      // Never stored anywhere: it is personal data, and it is different
      // every time a day is recorded. The service worker is told the
      // same thing separately — serwist's default rules cache everything
      // under /api with NetworkFirst, so this path is listed in the
      // worker's NetworkOnly matcher (src/app/sw.ts).
      "Cache-Control": "no-store",
    },
  });
};
