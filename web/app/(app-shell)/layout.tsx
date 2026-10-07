import type { ReactNode } from "react";

import { BottomNav } from "@/widgets/bottom-nav";

type AppShellLayoutProps = {
  children: ReactNode;
};

// The route group for the five screens behind the navigation (ADR 0045).
// A route group changes no addresses — it exists so that one layout adds
// the bar to all of them, the same way app/(with-footer)/layout.tsx adds
// the footer (ADR 0029).
//
// The bar is fixed, so it is out of flow and cannot push anything: the
// padding below is what keeps the last line of a screen from hiding
// underneath it. 26 spacing steps = the prototype's 24px offset + the
// 64px bar + the 12px the Day button is lifted by, plus the safe-area
// inset underneath all three.
export const AppShellLayout = ({ children }: AppShellLayoutProps) => (
  <div className="flex min-h-dvh flex-col pb-[calc(--spacing(26)+env(safe-area-inset-bottom))]">
    {children}
    <BottomNav />
  </div>
);

export default AppShellLayout;
