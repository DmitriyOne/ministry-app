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
type TextLinkProps = Omit<LinkPrimitiveProps, "className"> & {
  className?: string;
};

export const TextLink = ({ className, href, ...props }: TextLinkProps) => (
  <LinkPrimitive
    data-slot="text-link"
    href={href}
    className={cn(
      "text-caption font-500 text-ink-faint underline-offset-4 outline-none hover:underline focus-visible:underline pressable [--press-scale:0.97]",
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
