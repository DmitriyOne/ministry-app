"use client";

import NextLink from "next/link";
import { cn } from "@/shared/lib/cn";
import {
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components";

import { isInternalHref } from "@/shared/ui/button";

// A quiet inline text link — for a case like ScreenFooter's "About",
// where LinkButton's button chrome (padding, background, rounded-button
// radius) doesn't fit (ADR 0029). Same react-aria Link + next/link
// render-prop wiring as LinkButton (ADR 0024), so it still gets
// client-side navigation for internal paths and skips LaunchGate
// re-running on every tap.
//
// Underlined at rest now (ADR 0029, amendment) — previously it only
// underlined on hover/focus-visible, which left the resting state with
// no visible affordance now that a footer can contain a link to the
// page you're already on (styled `isCurrent`, below) sitting right next
// to ones you can actually follow. With the underline permanently on,
// hover/focus-visible toggling it no longer means anything, so that's
// gone too; `focus-visible:ring-2` takes over as the visible keyboard
// focus indicator instead.
type TextLinkProps = Omit<LinkPrimitiveProps, "className"> & {
  className?: string;
  // Purely presentational — bold against the resting (already
  // underlined) state, for a link that points at the page currently
  // being viewed. TextLink stays routeless and dumb on purpose: it has
  // no idea what "current" means, the caller (ScreenFooter/FooterLink)
  // works that out and passes the answer in. `aria-current="page"` is
  // a separate, ordinary prop — pass it alongside this one, it's not
  // implied by it.
  isCurrent?: boolean;
};

export const TextLink = ({ className, href, isCurrent = false, ...props }: TextLinkProps) => (
  <LinkPrimitive
    data-slot="text-link"
    href={href}
    className={cn(
      "text-caption font-500 text-ink-faint underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring pressable [--press-scale:0.97]",
      isCurrent && "font-600 text-ink",
      className,
    )}
    render={
      isInternalHref(href)
        ? (linkProps) => ("href" in linkProps ? <NextLink {...linkProps} href={href} /> : <span {...linkProps} />)
        : undefined
    }
    {...props}
  />
);
