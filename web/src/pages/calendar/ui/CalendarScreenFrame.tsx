import type { ReactNode } from "react";

import { CenteredState } from "@/shared/ui/centered-state";

// The screen's outline, in one place because three things have to agree
// on it: the calendar itself, the skeleton shown while it is read, and
// the bare /calendar while it works out which month the person is in.
//
// Identical to MonthScreenFrame and YearScreenFrame, and copied rather
// than shared for the reason named in ADR 0067: one page may not import
// another's internals, and a frame in shared/ui would be a fourth place
// to keep in step for no gain.
type CalendarScreenFrameProps = {
  children: ReactNode;
};

export const CalendarScreenFrame = ({ children }: CalendarScreenFrameProps) => (
  <CenteredState fill className="items-stretch justify-start gap-5 px-5 pt-6 text-left">
    {children}
  </CenteredState>
);
