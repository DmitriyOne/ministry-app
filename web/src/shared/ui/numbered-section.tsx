import type { ReactNode } from "react";

// One section of a numbered legal-document-style screen (currently
// /privacy, ADR 0031): a small index number next to an <h2>, with
// whatever body content the caller passes as children (paragraphs,
// lists, a table — the mix differs per section, so this doesn't try to
// impose one shape). `id` lets SectionIndex's anchor chips jump here.
// The scroll-margin-top below clears PrivacyScreen's sticky
// ScreenBackHeader: the DOCUMENT is the scroll container there now
// (ADR 0031's amendment
// corrects the earlier record — a nested <main> scroll container used
// to make `sticky` a no-op, which is why it never needed clearing
// before), so a chip jump scrolls a heading right under the header
// unless the anchor's landing position is pushed down past it. The
// offset is the header's own rendered height — `pt-6` (24px) + the
// 38px back-button control + `pb-3` (12px) = 74px, plus the iOS
// safe-area inset the header itself adds on top (`env(safe-area-inset-
// top)`, ADR 0020) — plus a little extra breathing room so the heading
// doesn't land flush under the header's bottom edge.
type NumberedSectionProps = {
  id: string;
  number: number;
  title: ReactNode;
  children: ReactNode;
};

export const NumberedSection = ({ id, number, title, children }: NumberedSectionProps) => (
  <section
    id={id}
    className="flex scroll-mt-[calc(env(safe-area-inset-top)+92px)] flex-col gap-2"
  >
    <h2 className="flex items-baseline gap-2 text-list-row font-600 tracking-list-row text-ink">
      <span aria-hidden="true" className="text-caption font-620 tabular-nums text-ink-faint">
        {number}
      </span>
      {title}
    </h2>
    <div className="flex flex-col gap-2.5">{children}</div>
  </section>
);
