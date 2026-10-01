import type { ReactNode } from "react";

import { ScreenFooter } from "@/widgets/screen-footer";

// Route group (parentheses don't change the URL — /, /day, /soon, /install
// keep their addresses) that adds a shared "About" footer under these
// screens without touching /access/* or /about itself, both outside the
// group. See ADR 0029.
//
// This wrapper is what makes the footer fit on the first screen instead
// of trailing off below the fold: it — not each screen — reserves the
// full viewport height (`min-h-dvh`) and lays it out as a column, so the
// footer (natural height, last) and the screen's content (`flex-1`,
// first — see CenteredState's `fill` prop and DayPage/InstallAppScreen/
// ComingSoonScreen) share it instead of the content claiming the whole
// viewport on its own and pushing the footer past the bottom edge. On
// short content the content area simply grows to fill the gap above the
// footer; on tall content (e.g. /soon with the keyboard open and a
// validation error) `flex-1` doesn't clip it — flex items don't shrink
// below their content's natural height by default — so the column grows
// past `min-h-dvh` and the page scrolls, same as before.
type WithFooterLayoutProps = {
  children: ReactNode;
};

const WithFooterLayout = ({ children }: WithFooterLayoutProps) => (
  <div className="flex min-h-dvh flex-col">
    {children}
    <ScreenFooter />
  </div>
);

export default WithFooterLayout;
