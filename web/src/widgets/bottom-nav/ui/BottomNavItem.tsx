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
  hasFamily?: boolean;
};

// The one client piece of the navigation, for the same reason
// widgets/screen-footer/ui/FooterLink.tsx is: knowing which item points at
// the page currently open needs usePathname, which only works in a Client
// Component. Everything else stays server-side.
//
// LinkButton, not a bare <a>: an internal path has to navigate client-side
// (ADR 0024), or every tap on the menu runs LaunchGate and its loading
// screen again (ADR 0017/0019/0028).
export const BottomNavItem = ({
  href,
  label,
  children,
  isPrimary = false,
  hasFamily = false,
}: BottomNavItemProps) => {
  // `?? ""` guards against the `string | null` signature some toolchains
  // attribute to usePathname; the comparison itself lives in the model,
  // under test.
  const isCurrent = isNavItemCurrent(usePathname() ?? "", href, hasFamily);

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
        // text-eyebrow is 11px: the 10px of --text-tab was part of what
        // read as "too small" on the phone. Only the size comes from it —
        // tracking-tab stays, and the uppercase an eyebrow usually carries
        // is not applied here.
        "h-auto flex-col gap-1 bg-transparent p-0 text-eyebrow font-600 tracking-tab shadow-none",
        isPrimary
          // 60px, lifted by 8, on a 68px bar. The prototype's 76 made the
          // button the whole navigation; 56 on the smaller bar was right
          // then and is undersized now. The halo in
          // shadow-nav-primary is what makes the lift read as deliberate
          // rather than as a misplaced circle.
          ? "size-15 -translate-y-2 rounded-full bg-primary text-hero-foreground/85 shadow-nav-primary [--press-scale:0.94]"
          // No radius and no background: the item is a tap target, not a
          // shape. That is how the concentric-radius problem went away
          // rather than being solved again — there is no inner rectangle
          // left to keep in step with the bar's 28.
          : "h-15 w-16",
        // The inactive colour is --ink-faint, not the prototype's 0.42
        // opacity: that is the level ADR 0011 rejected as failing AA.
        //
        // The active marker, variant N2: the icon's own shape fills with
        // the primary colour at 15%, and nothing sits behind it. The
        // plate is gone deliberately — a tinted rectangle under one of
        // five items was what the owner disliked, and a filled shape
        // says the same thing without adding furniture to a 56px bar.
        //
        // The fill lands on the <svg> through a descendant selector
        // because the icon is rendered on the server, by BottomNav, and
        // handed here as a finished element: this component cannot pass
        // it a prop, but it can style it.
        !isPrimary && (isCurrent
          ? "font-640 text-primary [&_svg]:fill-primary/15"
          : "text-ink-faint"),
      )}
    >
      {children}
      <span>{label}</span>
    </LinkButton>
  );
};
