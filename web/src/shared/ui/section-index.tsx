import type { ReactNode } from "react";

// A wrapping row of chips that jump to the numbered sections below them
// on a long single-page document (currently /privacy, ADR 0031) — real
// in-page anchors (<a href="#...">), not a route/client-navigation
// component: a same-page fragment jump needs nothing beyond the
// browser's own anchor handling, so this deliberately doesn't reach for
// TextLink/LinkButton (both built for AppRoute navigation, ADR 0024/0029).
// Each target section must carry a matching `id` and `scroll-mt-*` so a
// sticky header above it doesn't cover the heading on jump — see
// numbered-section.tsx.
type SectionIndexItem = {
  href: string;
  label: ReactNode;
};

type SectionIndexProps = {
  items: SectionIndexItem[];
};

export const SectionIndex = ({ items }: SectionIndexProps) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <a
        key={item.href}
        href={item.href}
        className="rounded-full border border-ink-a09 bg-card px-3 py-1.5 text-caption font-580 text-hero outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        {item.label}
      </a>
    ))}
  </div>
);
