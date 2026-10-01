import type { ReactNode } from "react";

// One section of a numbered legal-document-style screen (currently
// /privacy, ADR 0031): a small index number next to an <h2>, with
// whatever body content the caller passes as children (paragraphs,
// lists, a table — the mix differs per section, so this doesn't try to
// impose one shape). `id` lets SectionIndex's anchor chips jump here.
// `scroll-mt-4` is just a small breathing-room offset, not a fix for a
// sticky header covering the heading: PrivacyScreen's ScreenBackHeader
// sits OUTSIDE <main>, and <main> (not the document) is the scroll
// container (flex-1 overflow-y-auto), so the sticky header never
// overlaps scrolled content there — nothing needs clearing.
type NumberedSectionProps = {
  id: string;
  number: number;
  title: ReactNode;
  children: ReactNode;
};

export const NumberedSection = ({ id, number, title, children }: NumberedSectionProps) => (
  <section id={id} className="flex scroll-mt-4 flex-col gap-2">
    <h2 className="flex items-baseline gap-2 text-list-row font-600 tracking-list-row text-ink">
      <span aria-hidden="true" className="text-caption font-620 tabular-nums text-ink-faint">
        {number}
      </span>
      {title}
    </h2>
    <div className="flex flex-col gap-2.5">{children}</div>
  </section>
);
