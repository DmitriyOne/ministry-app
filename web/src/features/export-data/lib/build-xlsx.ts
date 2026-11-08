import "server-only";

import writeXlsxFile from "write-excel-file/node";

import type { ExportDayRow, ExportMonthRow } from "../model/export-rows";

// The same data as the CSV, as a real spreadsheet (ADR 0071).
//
// Two things a .csv cannot do, which is the whole reason this exists
// beside it: the date is a DATE and the minutes are a NUMBER, so sorting
// and summing work without anybody retyping a column; and there are two
// sheets, because month totals and day detail are two tables and a CSV
// holds one.
//
// `write-excel-file` rather than exceljs: one dependency (fflate) and
// 1.8 MB against nine dependencies and 21.8 MB, for a job that only
// writes. Measured, not guessed — ADR 0071 has the figures.
//
// Server-only, and it has to be: the Node entry point reaches for
// `node:fs` and `node:stream`. It costs the browser nothing because the
// file is built in a Route Handler and only the bytes travel.

// Dates are converted with `date.getTime()` alone (checked in
// write-excel-file's convertDateToSerialNumber), so a UTC midnight comes
// out as a whole serial day in any server zone. That is why the key is
// read as UTC here rather than handed over as a string: it survives the
// server moving to another region.
const asUtcDate = (day: string): Date => new Date(`${day}T00:00:00Z`);

const HEADER = { fontWeight: "bold" } as const;

export type XlsxLabels = {
  daysSheet: string;
  monthsSheet: string;
  date: string;
  weekday: string;
  hours: string;
  minutes: string;
  month: string;
  serviceYear: string;
  daysRecorded: string;
};

export const buildXlsx = async (
  days: ExportDayRow[],
  months: ExportMonthRow[],
  labels: XlsxLabels,
): Promise<Buffer> => {
  const daysSheet = [
    [
      { value: labels.date, ...HEADER },
      { value: labels.weekday, ...HEADER },
      { value: labels.hours, ...HEADER },
      { value: labels.minutes, ...HEADER },
      { value: labels.month, ...HEADER },
      { value: labels.serviceYear, ...HEADER },
    ],
    ...days.map((day) => [
      { value: asUtcDate(day.day), type: Date, format: "yyyy-mm-dd" },
      { value: day.weekday, type: String },
      { value: day.hours, type: String },
      { value: day.minutes, type: Number },
      { value: day.month, type: String },
      { value: day.serviceYear, type: String },
    ]),
  ];

  const monthsSheet = [
    [
      { value: labels.month, ...HEADER },
      { value: labels.daysRecorded, ...HEADER },
      { value: labels.hours, ...HEADER },
      { value: labels.minutes, ...HEADER },
    ],
    ...months.map((month) => [
      { value: month.month, type: String },
      { value: month.daysRecorded, type: Number },
      { value: month.hours, type: String },
      { value: month.minutes, type: Number },
    ]),
  ];

  // Months first: it is the sheet somebody opens the file for, and a
  // workbook opens on its first sheet.
  //
  // The tab's name is `sheet`, not `name` — `name` is silently ignored,
  // which the type checker caught and a smoke test did not: the file
  // still built, with the tabs left as "Sheet1" and "Sheet2".
  return writeXlsxFile([
    {
      sheet: labels.monthsSheet,
      data: monthsSheet,
      columns: [{ width: 12 }, { width: 16 }, { width: 10 }, { width: 10 }],
    },
    {
      sheet: labels.daysSheet,
      data: daysSheet,
      columns: [
        { width: 12 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 12 },
        { width: 14 },
      ],
    },
  ]).toBuffer();
};
