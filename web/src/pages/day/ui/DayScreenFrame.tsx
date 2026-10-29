import type { ReactNode } from "react";

import { CenteredState } from "@/shared/ui/centered-state";

// The screen's outline and its heading, in one place because four things
// have to agree on them: the day itself, the skeleton shown while the
// hours are read, the bare /day while it works out which day today is,
// and whatever stands there when a read fails. Any difference between
// them shows up as a jump at the moment the data arrives — the skeleton
// used to carry a copy of these classes with a comment asking the next
// person to keep them identical, which is the work nobody does.
//
// Not centred like the state screens: this one grows downwards as the day
// gets its remaining sections, so it starts at the top and the children
// stretch to the full width.
type DayScreenFrameProps = {
  heading: ReactNode;
  children: ReactNode;
};

export const DayScreenFrame = ({ heading, children }: DayScreenFrameProps) => (
  <CenteredState fill className="items-stretch justify-start gap-5 px-5 pt-6 text-left">
    {heading}
    {children}
  </CenteredState>
);
