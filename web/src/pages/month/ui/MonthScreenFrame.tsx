import type { ReactNode } from "react";

import { CenteredState } from "@/shared/ui/centered-state";

// The screen's outline, in one place because three things have to agree
// on it: the month itself, the skeleton shown while it is read, and the
// bare /month while it works out which month the person is in. Any
// difference between them shows up as a jump at the moment the data
// arrives — which is exactly what DayScreenFrame was extracted to stop,
// and this screen reproduced the defect by passing the classes inline.
//
// Not centred like the state screens CenteredState is built for: this
// one grows downwards, so it starts at the top and its children stretch
// to the full width. `items-stretch` and `text-left` are the two that
// matter and the two a className easily forgets — without them every
// block shrink-wraps to its content and the day column is centred under
// a left-aligned heading. `px-5` is the app's gutter; CenteredState's
// own `px-8` belongs to the one-state screens.
type MonthScreenFrameProps = {
  children: ReactNode;
};

export const MonthScreenFrame = ({ children }: MonthScreenFrameProps) => (
  <CenteredState fill className="items-stretch justify-start gap-5 px-5 pt-6 text-left">
    {children}
  </CenteredState>
);
