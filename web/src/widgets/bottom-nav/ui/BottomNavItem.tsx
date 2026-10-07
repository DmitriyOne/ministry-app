"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import type { AppRoute } from "@/shared/config";
import { cn } from "@/shared/lib/cn";
import { LinkButton } from "@/shared/ui/button";

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
  // Same two guards as FooterLink: `?? ""` for the `string | null`
  // signature some toolchains attribute to usePathname, and a trailing
  // slash normalised away before comparing. Exact comparison, not a
  // prefix — /month must not light up for a future /month-summary.
  const pathname = usePathname() ?? "";
  const normalisedPathname
    = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const isCurrent = normalisedPathname === href;

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
          // -translate-y-3 lifts it out of the bar; the halo in
          // shadow-nav-primary is what makes the lift read as deliberate.
          ? "size-19 -translate-y-3 rounded-full bg-primary text-hero-foreground/85 shadow-nav-primary [--press-scale:0.94]"
          : "h-13.5 w-14.5 rounded-lg",
        // The prototype paints an inactive item at 0.42 opacity, which is
        // the level ADR 0011 rejected as failing AA — --ink-faint is the
        // project's muted text and what every other screen uses. The
        // active item is the full ink, which is the contrast between them.
        !isPrimary && (isCurrent ? "text-ink" : "text-ink-faint"),
      )}
    >
      {children}
      <span>{label}</span>
    </LinkButton>
  );
};
