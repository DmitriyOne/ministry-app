import type { ReactNode } from "react";

import { RecheckGateOnRestore } from "@/features/gate-recheck";
import { BottomNav } from "@/widgets/bottom-nav";

type WithBottomNavLayoutProps = {
  children: ReactNode;
};

// The route group for the five screens behind the navigation (ADR 0045).
// A route group changes no addresses — it exists so that one layout adds
// the bar to all of them, and it is named the way its neighbour is:
// (with-footer) says what its layout adds, so this one says the same.
//
// The bar is fixed, so it is out of flow and cannot push anything: the
// padding below is what keeps the last line of a screen from hiding
// underneath it. 26 spacing steps = the prototype's 24px offset + the
// 64px bar + the 12px the Day button is lifted by, plus the safe-area
// inset underneath all three.
export const WithBottomNavLayout = ({ children }: WithBottomNavLayoutProps) => (
  <div className="flex min-h-dvh flex-col pb-[calc(--spacing(26)+env(safe-area-inset-bottom))]">
    {children}
    <BottomNav />
    {/* Renders nothing. These five screens all require a session, so a
        page the browser restores from its own cache — after a sign-out in
        another tab, or after an outage longer than the token's hour — has
        to ask the server again instead of being trusted. The mirror image
        of the same component on /login. */}
    <RecheckGateOnRestore />
  </div>
);

export default WithBottomNavLayout;
