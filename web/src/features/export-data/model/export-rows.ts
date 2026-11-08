import { type DayKey, formatHours, formatDayWeekday, parseDayKey } from "@/entities/ministry-day";
import { serviceYearOf, toMonthKey, yearHeading } from "@/entities/ministry-status";

// What leaves the app when somebody asks for their data (ADR 0071).
//
// One row per recorded day, which is the whole of what this app keeps:
// everything else on every screen — month totals, the service year, the
// pace — is worked out from these numbers. Nothing is summarised away.
export type ExportDayRow = {
  day: DayKey;
  // The weekday the date fell on, written out in full ("Friday"). Not in
  // the database and not derivable in a spreadsheet without a formula,
  // which is exactly why it is here.
  //
  // The long form, not the "Fri" of the last-days strip: a column in a
  // file is read on its own, with nothing beside it to make a
  // three-letter stub obvious, and the width costs nothing here.
  weekday: string;
  // The same minutes as a clock reading, "2:05". For reading.
  hours: string;
  // The stored value, untouched. For counting.
  minutes: number;
  // "2026-11". The month as a spreadsheet can group by it.
  month: string;
  // "2026 / 2027", the service year the month belongs to — September to
  // August, the one calendar boundary this project has. Taken from the
  // entity rather than worked out here: a second place that knows about
  // September is a second place to keep in step (ADR 0061, decision 1).
  serviceYear: string;
};

// A month as it adds up. Derived from the rows above and from nothing
// else, so the export cannot disagree with itself.
export type ExportMonthRow = {
  month: string;
  // How many days of that month have a record at all. A recorded zero
  // counts: somebody opened that day and said nothing happened, which is
  // not the same as never having opened it (the distinction the calendar
  // is built on, ADR 0069).
  daysRecorded: number;
  hours: string;
  minutes: number;
};

// Year and month out of a DayKey. The shape is fixed by parseDayKey, so
// slicing is safe here — and it is slicing rather than `new Date()`
// deliberately: a key carries no zone, and reading it in the server's
// would move the date by a day for anybody west of it.
const yearOf = (day: DayKey): number => Number(day.slice(0, 4));
const monthOf = (day: DayKey): number => Number(day.slice(5, 7));

// A row whose day comes back in a shape parseDayKey refuses is dropped
// rather than trusted, the way the calendar and the month table drop one.
// An export is a file somebody keeps, and a line reading "2026-06-31" in
// it would outlive any explanation.
//
// Sorted ascending here rather than relied on from the query: the order
// of a file is part of what it is, and a reader should not have to know
// which clause produced it.
export const buildExportDayRows = (
  rows: { day: string; minutes: number }[],
): ExportDayRow[] => {
  const days: ExportDayRow[] = [];

  for (const row of rows) {
    const day = parseDayKey(row.day);

    if (day === null) continue;

    days.push({
      day,
      weekday: formatDayWeekday(day),
      hours: formatHours(row.minutes),
      minutes: row.minutes,
      month: day.slice(0, 7),
      serviceYear: yearHeading(serviceYearOf(toMonthKey(yearOf(day), monthOf(day)))),
    });
  }

  return days.sort((left, right) => left.day.localeCompare(right.day));
};

// The months, in the order the days came in. A Map rather than an object
// so insertion order is guaranteed by the language rather than by how
// JavaScript happens to order integer-like keys.
export const buildExportMonthRows = (days: ExportDayRow[]): ExportMonthRow[] => {
  const totals = new Map<string, { daysRecorded: number; minutes: number }>();

  for (const day of days) {
    const running = totals.get(day.month) ?? { daysRecorded: 0, minutes: 0 };

    totals.set(day.month, {
      daysRecorded: running.daysRecorded + 1,
      minutes: running.minutes + day.minutes,
    });
  }

  return [...totals].map(([month, { daysRecorded, minutes }]) => ({
    month,
    daysRecorded,
    hours: formatHours(minutes),
    minutes,
  }));
};
