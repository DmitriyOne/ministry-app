import type { ReactNode } from "react";

import { CenteredState } from "@/shared/ui/centered-state";

// The screen's outline, in one place because three things have to agree
// on it: the year itself, the skeleton shown while it is read, and the
// bare /year while it works out which year the person is in. Any
// difference between them shows up as a jump at the moment the data
// arrives — the defect DayScreenFrame was extracted to stop and the
// month screen reproduced by passing the classes inline.
//
// Identical to MonthScreenFrame, and copied rather than shared for the
// reason named in ADR 0067: one page may not import another's internals,
// and a frame in shared/ui would be a third place to keep in step for no
// gain while it has two users.
type YearScreenFrameProps = {
  children: ReactNode;
};

export const YearScreenFrame = ({ children }: YearScreenFrameProps) => (
  <CenteredState fill className="items-stretch justify-start gap-5 px-5 pt-6 text-left">
    {children}
  </CenteredState>
);
