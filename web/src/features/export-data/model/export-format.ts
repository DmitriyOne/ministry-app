import type { DayKey } from "@/entities/ministry-day";

// The two formats the export answers in, and everything that follows
// from the choice (ADR 0071).
export const EXPORT_FORMATS = ["csv", "xlsx"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

// The boundary. Anything that is not one of the two is null, and the
// route answers 400 rather than guessing: a guess here would hand
// somebody a .csv when they asked for a spreadsheet, and the file would
// be the only place that said so.
export const parseExportFormat = (value: string | null): ExportFormat | null =>
  EXPORT_FORMATS.find((format) => format === value) ?? null;

export const EXPORT_CONTENT_TYPE: Record<ExportFormat, string> = {
  // `charset=utf-8` beside the BOM, not instead of it: the header tells
  // a browser, the BOM tells a spreadsheet opening the saved file later,
  // and by then there is no header any more.
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// What the file is called once it is on the phone. The date is the day it
// was taken, in the person's own calendar, so two exports a week apart
// sort next to each other and neither overwrites the other.
//
// ASCII only and no spaces: this string travels in a Content-Disposition
// header, where anything else needs the RFC 5987 encoding and is worth
// avoiding entirely.
export const exportFileName = (format: ExportFormat, today: DayKey): string =>
  `ministry-${today}.${format}`;
