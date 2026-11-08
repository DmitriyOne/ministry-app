import { describe, expect, it } from "vitest";

import { toCsv } from "./to-csv";

const BOM = "﻿";

describe("toCsv", () => {
  it("starts with a byte-order mark, so Excel reads it as UTF-8", () => {
    expect(toCsv([["Date"]]).startsWith(BOM)).toBe(true);
  });

  it("separates rows with CRLF and ends the last one", () => {
    expect(toCsv([["a"], ["b"]])).toBe(`${BOM}a\r\nb\r\n`);
  });

  it("leaves numbers unquoted, so a spreadsheet can sum them", () => {
    expect(toCsv([["2026-11-06", 125]])).toBe(`${BOM}2026-11-06,125\r\n`);
  });

  it("quotes a value holding the separator", () => {
    expect(toCsv([["one,two"]])).toBe(`${BOM}"one,two"\r\n`);
  });

  it("doubles an inner quote and wraps the value", () => {
    expect(toCsv([["say \"this\""]])).toBe(`${BOM}"say ""this"""\r\n`);
  });

  it("quotes a value holding a newline rather than breaking the row", () => {
    expect(toCsv([["two\nlines"]])).toBe(`${BOM}"two\nlines"\r\n`);
  });

  // Some readers trim an unquoted field, which would make the value mean
  // something different after a round trip.
  it("quotes a value with leading or trailing whitespace", () => {
    expect(toCsv([[" padded "]])).toBe(`${BOM}" padded "\r\n`);
  });

  it("leaves an ordinary value alone, so the file stays readable by eye", () => {
    expect(toCsv([["Mon", "2:05"]])).toBe(`${BOM}Mon,2:05\r\n`);
  });

  it("writes a header-only file when there is nothing recorded", () => {
    expect(toCsv([["Date", "Minutes"]])).toBe(`${BOM}Date,Minutes\r\n`);
  });
});
