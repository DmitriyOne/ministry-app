import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

// A plain, real <table> — not react-aria-components' Table, which is an
// interactive ARIA grid widget (row selection/focus model, sortable
// columns) meant for data grids, not a static 2–3-row reference table.
// Wrapping this content in that widget would add ARIA semantics
// (gridcell/row roles, a managed focus ring) a screen reader doesn't
// expect from "just a table of facts" — checked against shadcn/ui's
// registry (context7, ADR 0031) before hand-rolling this.
//
// Tones reuse the project's existing colour tokens at low alpha for the
// pill fill (same construction as --ink-a07/--ink-a09 in globals.css),
// not the --positive-hero/--negative-hero pair — those are documented
// "ONLY on top of --hero" (globals.css), and this table sits on the
// plain card background, not the dark hero card.
const STATUS_TONE = {
  positive: "bg-primary/12 text-primary",
  negative: "bg-negative/12 text-negative",
} as const;

export type CookieTableStatus = keyof typeof STATUS_TONE;

export type CookieTableRow = {
  id: string;
  name: ReactNode;
  purpose: ReactNode;
  type: ReactNode;
  status: CookieTableStatus;
  statusLabel: ReactNode;
};

type CookieTableProps = {
  caption: ReactNode;
  headings: { name: ReactNode; purpose: ReactNode; type: ReactNode };
  rows: CookieTableRow[];
};

export const CookieTable = ({ caption, headings, rows }: CookieTableProps) => (
  <div className="overflow-hidden rounded-xl bg-card shadow-card">
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="bg-ink-a05">
          <th scope="col" className="px-3 py-2.5 text-eyebrow font-620 tracking-eyebrow uppercase text-ink-faint">
            {headings.name}
          </th>
          <th scope="col" className="px-3 py-2.5 text-eyebrow font-620 tracking-eyebrow uppercase text-ink-faint">
            {headings.purpose}
          </th>
          <th scope="col" className="px-3 py-2.5 text-eyebrow font-620 tracking-eyebrow uppercase text-ink-faint">
            {headings.type}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-ink-a07 align-top">
            <td className="px-3 py-3 text-caption font-580 text-ink">{row.name}</td>
            <td className="px-3 py-3 text-caption text-ink-muted">{row.purpose}</td>
            <td className="px-3 py-3">
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-eyebrow font-600 tracking-eyebrow",
                  STATUS_TONE[row.status],
                )}
              >
                {row.statusLabel}
              </span>
              <span className="mt-1 block text-caption text-ink-faint">{row.type}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
