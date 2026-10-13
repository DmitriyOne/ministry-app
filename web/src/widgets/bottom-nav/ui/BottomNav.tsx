import { getTranslations } from "next-intl/server";

import { navItems } from "../model/nav-items";
import { BottomNavItem } from "./BottomNavItem";

// The glass bar from the prototype (menu.html), fixed to the bottom of the
// viewport. A Server Component: it only needs getTranslations and renders
// the icons itself, handing each finished element to the client leaf.
//
// The bottom offset carries env(safe-area-inset-bottom) on top of the
// prototype's 24px, so the bar clears the home indicator
// (viewport-fit=cover, ADR 0020). The space it occupies is reserved by
// app/(with-bottom-nav)/layout.tsx, not here — a fixed element is out of flow
// and cannot push content up by itself.
export const BottomNav = async () => {
  const t = await getTranslations("nav");

  return (
    <nav
      aria-label={t("label")}
      className="fixed bottom-[calc(--spacing(1)+env(safe-area-inset-bottom))] left-1/2 z-40 flex h-14 -translate-x-1/2 items-center gap-1 rounded-3xl border border-nav-border bg-nav-surface px-2.5 shadow-nav backdrop-blur-[26px] backdrop-saturate-[1.8]"
    >
      {navItems.map(({ href, labelKey, Icon, isPrimary }) => (
        <BottomNavItem key={href} href={href} label={t(labelKey)} isPrimary={isPrimary}>
          {/* aria-hidden by default in every icon of ours: the label next
              to it already says the same thing. */}
          {/* The primary button keeps its own size and a heavier stroke
              than our older PlusIcon draws by default, so the one icon
              that is not from the N2 family still reads as part of it. */}
          <Icon size={isPrimary ? 20 : 26} strokeWidth={2} />
        </BottomNavItem>
      ))}
    </nav>
  );
};
