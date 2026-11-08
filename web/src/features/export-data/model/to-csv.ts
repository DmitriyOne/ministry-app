// A CSV that Excel and Numbers both open without being told anything
// (ADR 0071).
//
// Three things make that true, and all three are easy to leave out:
//
//   * CRLF line endings, which is what RFC 4180 specifies;
//   * a byte-order mark, so a spreadsheet reads the file as UTF-8 rather
//     than guessing from the first bytes. Excel on Windows guesses the
//     system code page without it;
//   * quoting that covers the separator, the quote itself and newlines.
//
// The BOM is prepended HERE rather than by the caller, deliberately: it
// is part of what makes this a file somebody can open, not a transport
// detail, and a caller who forgets it produces something that looks fine
// in a text editor and mangles any non-ASCII in Excel.
const CSV_BOM = "﻿";
const CSV_SEPARATOR = ",";
const CSV_NEWLINE = "\r\n";

// Quoted only when it has to be. A file where every field is quoted is
// still valid, but it is harder to read in a text editor, and reading it
// in a text editor is half of why anybody asks for CSV.
//
// Leading or trailing whitespace is quoted too: some readers trim it, and
// a value that means something different after a round trip is worse than
// a quote nobody needed.
const quote = (value: string): string => {
  const needsQuotes = value.includes(CSV_SEPARATOR)
    || value.includes("\"")
    || value.includes("\n")
    || value.includes("\r")
    || value.trim() !== value;

  return needsQuotes ? `"${value.replaceAll("\"", "\"\"")}"` : value;
};

// A cell is text or a number. Numbers go in bare — quoting them would
// make a spreadsheet read them as text, and the whole point of carrying
// the raw minutes beside the clock reading is that they can be summed.
const cell = (value: string | number): string =>
  typeof value === "number" ? String(value) : quote(value);

// No guard against values starting with "=", "+", "-" or "@" (the
// formula-injection trick), and that is a decision rather than an
// omission: not one column in this export can hold text a person typed.
// Every cell is a date key, an integer, a clock reading or a weekday this
// code generated. If a free-text column is ever added — a note on a day,
// say — this is the function that has to grow a prefix guard, and that
// sentence is here so the next reader knows it.
export const toCsv = (rows: (string | number)[][]): string =>
  CSV_BOM + rows.map((row) => row.map(cell).join(CSV_SEPARATOR)).join(CSV_NEWLINE) + CSV_NEWLINE;
