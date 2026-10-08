"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import type { AppRoute } from "@/shared/config";
import { cn } from "@/shared/lib/cn";
import { LinkButton } from "@/shared/ui/button";

import { isNavItemCurrent } from "../model/is-nav-item-current";

type BottomNavItemProps = {
  href: AppRoute;
  label: string;
  // The icon, already rendered by BottomNav on the server.
  children: ReactNode;
  isPrimary?: boolean;
};

// The one client piece of the navigation, for the same reason
// widgets/screen-footer/ui/FooterLink.tsx is: knowing which item points at
// the page currently open needs usePathname, which only works in a Client
// Component. Everything else stays server-side.
//
// LinkButton, not a bare <a>: an internal path has to navigate client-side
// (ADR 0024), or every tap on the menu runs LaunchGate and its loading
// screen again (ADR 0017/0019/0028).
export const BottomNavItem = ({ href, label, children, isPrimary = false }: BottomNavItemProps) => {
  // `?? ""` guards against the `string | null` signature some toolchains
  // attribute to usePathname; the comparison itself lives in the model,
  // under test.
  const isCurrent = isNavItemCurrent(usePathname() ?? "", href);

  return (
    <LinkButton
      href={href}
      variant="plain"
      // aria-current is the HTML attribute, read by assistive tech; the
      // classes below are presentation. Two independent things, as in
      // TextLink/FooterLink — the component does not infer one from the
      // other.
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "h-auto flex-col gap-1 bg-transparent p-0 text-tab font-600 tracking-tab shadow-none",
        isPrimary
          // 56px, lifted by 8. The prototype's 76 on a 64px bar made the
          // button the whole navigation; 64 was still heavy. The halo in
          // shadow-nav-primary is what makes the lift read as deliberate
          // rather than as a misplaced circle.
          ? "size-14 -translate-y-2 rounded-full bg-primary text-hero-foreground/85 shadow-nav-primary [--press-scale:0.94]"
          // rounded-md (18px) under the bar's rounded-xl (22): radii
          // that sit inside one another have to be concentric, inner =
          // outer − gap, and the item clears the bar's edge by 5. The
          // pair of values is the owner's; what matters here is that
          // they stay a pair — changing the bar's radius without this
          // one brings back the pasted-on look.
          : "h-13.5 w-14.5 rounded-md",
        // The inactive colour is --ink-faint, not the prototype's 0.42
        // opacity: that is the level ADR 0011 rejected as failing AA. The
        // active one is --primary with a tint behind it — full ink next to
        // faint ink was a difference you had to look for, and the one
        // thing a navigation bar must say at a glance is where you are.
        !isPrimary && (isCurrent ? "bg-primary/10 text-primary" : "text-ink-faint"),
      )}
    >
      {children}
      <span>{label}</span>
    </LinkButton>
  );
};
