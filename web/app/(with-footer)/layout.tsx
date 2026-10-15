import type { ReactNode } from "react";

import { ScreenFooter } from "@/widgets/screen-footer";

// Route group (parentheses don't change the URL — /soon and /install keep
// their addresses) that adds the shared footer under these two screens,
// and only these two. It used to cover /, /day, /about and /privacy as
// well; the owner narrowed it (ADR 0029, amendment 2026-10-08) to the
// screens a visitor can reach before signing in, where those two links
// are the only other thing to read. Inside the app the same links live
// on /profile, and /about and /privacy carry their own back header, so a
// footer under them was a second way out of a screen that already had
// one.
//
// This wrapper is what makes the footer fit on the first screen instead
// of trailing off below the fold: it — not each screen — reserves the
// full viewport height (`min-h-app`) and lays it out as a column, so the
// footer (natural height, last) and the screen's content (`flex-1` via
// CenteredState's `fill` prop) share it instead of the content claiming
// the whole viewport and pushing the footer past the bottom edge. On
// tall content (e.g. /soon with the keyboard open and a validation
// error) `flex-1` doesn't clip it — flex items don't shrink below their
// content's natural height by default — so the column grows past
// `min-h-app` and the page scrolls, same as before.
type WithFooterLayoutProps = {
  children: ReactNode;
};

const WithFooterLayout = ({ children }: WithFooterLayoutProps) => (
  <div className="flex min-h-app flex-col">
    {children}
    <ScreenFooter />
  </div>
);

export default WithFooterLayout;
