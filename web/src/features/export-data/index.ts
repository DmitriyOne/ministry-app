// Deliberately mixed runtimes: this barrel exports a `server-only` read
// and an xlsx writer beside a CLIENT component (ExportDataRow). That is
// safe, and the reason is narrow enough to write down.
//
// `"use client"` is a boundary, not an import: the barrel itself is only
// ever evaluated on the server — by the profile screen and by the Route
// Handler, both server — and what crosses into the browser is the row
// module alone. The trap ADR 0034 describes is the other direction: a
// CLIENT module importing this barrel would drag `server-only` with it
// and fail the build.
//
// So the rule for this slice is one line: nothing inside it may import
// its own barrel. ExportDataRow reaches its model by relative path for
// exactly that reason.
export { readExportDays, type ExportDaysRead } from "./api/read-export-days";
export { buildXlsx, type XlsxLabels } from "./lib/build-xlsx";
export {
  EXPORT_CONTENT_TYPE,
  EXPORT_FORMATS,
  type ExportFormat,
  exportFileName,
  parseExportFormat,
} from "./model/export-format";
export {
  buildExportDayRows,
  buildExportMonthRows,
  type ExportDayRow,
  type ExportMonthRow,
} from "./model/export-rows";
export { toCsv } from "./model/to-csv";
export { ExportDataRow } from "./ui/ExportDataRow";
