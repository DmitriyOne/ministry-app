import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type FieldCardProps = {
  children: ReactNode;
  className?: string;
};

// The white card from the login mockup: stacked fields with a hairline
// between them. Dumb layout only — no form state, no validation, so it
// stays inside the shared/ui boundary (ADR 0013).
//
// The divider is a border on every child but the first, not a separate
// element after each field: a trailing hairline under the last field is
// the usual bug here.
export const FieldCard = ({ children, className }: FieldCardProps) => (
  <div
    className={cn(
      "flex flex-col rounded-xl bg-background px-4 shadow-card [&>*+*]:border-t [&>*+*]:border-ink-a09",
      className,
    )}
  >
    {children}
  </div>
);
