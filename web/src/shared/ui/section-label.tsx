import type { ReactNode } from "react";

// "Screens" / "Features" — a section label above a list card. Not the
// shared Eyebrow component: that one is uppercase and tracked wide
// (11px), this is a plain small caption (13px), a different role from
// the catalogue. See ADR 0029/0030.
type SectionLabelProps = {
  children: ReactNode;
};

export const SectionLabel = ({ children }: SectionLabelProps) => (
  <p className="px-1 pt-1.5 text-caption font-600 text-ink-faint">{children}</p>
);
