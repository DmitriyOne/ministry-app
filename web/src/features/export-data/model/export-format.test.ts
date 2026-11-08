import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config", () => ({
  routes: { day: "/day", month: "/month", year: "/year", calendar: "/calendar" },
}));

import { parseDayKey } from "@/entities/ministry-day";

import { EXPORT_CONTENT_TYPE, exportFileName, parseExportFormat } from "./export-format";

const day = (value: string) => {
  const key = parseDayKey(value);

  if (key === null) throw new Error(`not a day key: ${value}`);

  return key;
};

describe("parseExportFormat", () => {
  it("accepts the two formats on offer", () => {
    expect(parseExportFormat("csv")).toBe("csv");
    expect(parseExportFormat("xlsx")).toBe("xlsx");
  });

  // A guess would hand somebody a .csv when they asked for a spreadsheet,
  // and the file would be the only place that said so.
  it("refuses anything else, including an absent parameter", () => {
    expect(parseExportFormat("pdf")).toBeNull();
    expect(parseExportFormat("CSV")).toBeNull();
    expect(parseExportFormat("")).toBeNull();
    expect(parseExportFormat(null)).toBeNull();
  });
});

describe("exportFileName", () => {
  it("names the file after the day it was taken", () => {
    expect(exportFileName("csv", day("2026-11-07"))).toBe("ministry-2026-11-07.csv");
    expect(exportFileName("xlsx", day("2026-11-07"))).toBe("ministry-2026-11-07.xlsx");
  });

  // It travels in a Content-Disposition header, where anything outside
  // ASCII needs the RFC 5987 encoding.
  it("stays ASCII and free of spaces", () => {
    expect(exportFileName("xlsx", day("2026-01-01"))).toMatch(/^[\w.-]+$/);
  });
});

describe("EXPORT_CONTENT_TYPE", () => {
  it("declares the charset for CSV, since the header outlives nothing else", () => {
    expect(EXPORT_CONTENT_TYPE.csv).toContain("charset=utf-8");
  });

  it("uses the spreadsheet type Excel recognises", () => {
    expect(EXPORT_CONTENT_TYPE.xlsx)
      .toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });
});
