"use client";

import type { RefAttributes } from "react";
import NextLink from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";
import {
  Button as ButtonPrimitive,
  Link as LinkPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components";

// Uses --negative, not shadcn's own destructive token. The two resolve to
// the very same --palette-terracotta (globals.css), so this renames a
// duplicate rather than changing a colour: the project names that tone
// --negative everywhere else, and keeping both put a second name for one
// thing into the generated stylesheet. The dark: variants went with it —
// there is no dark theme (ADR 0011) and `.dark` is an empty placeholder, so
// they could never apply.
//
// Careful with the wording here: Tailwind scans these files as plain text,
// so spelling a utility class inside a comment is enough to emit its CSS.
// That is literally how the rule this change removed came back once.
//
// The `data-disabled:` pair beside the `disabled:` one is not a
// duplicate. react-aria sets `aria-disabled` on a <button> and never the
// native attribute (useButton: `disabled: elementType === "input" ?
// isDisabled : undefined`), so the `disabled:` rules matched nothing on
// any button in this project: a button that was out of reach looked
// untouched and, worse, still squeezed under a thumb, because CSS
// `:active` lands on an element that is not really disabled. The
// `disabled:` half stays for the native elements that use
// `buttonVariants` without react-aria. Found on review (ADR 0012), fixed
// across the app on the owner's say-so, 2026-10-28 — until then three
// call sites spelled it by hand.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 aria-invalid:border-negative aria-invalid:ring-3 aria-invalid:ring-negative/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        // Same rename as the aria-invalid classes above, and the dark:
        // variants dropped with it: one name for one colour. The variant
        // itself has no caller today — it is kept because it is part of the
        // registry's API, not because anything needs it.
        destructive:
          "bg-negative/10 text-negative hover:bg-negative/20 focus-visible:border-negative/40 focus-visible:ring-negative/20",
        link: "text-primary underline-offset-4 hover:underline",
        // Roles from the component catalogue (ADR 0012) — state screens.
        // Radius/height come from size="role"/"role-lg", not the
        // size variants above.
        deep: "rounded-button bg-hero text-hero-foreground pressable [--press-scale:0.98]",
        action:
          "rounded-button bg-primary text-primary-foreground pressable [--press-scale:0.98]",
        alert:
          "rounded-button bg-negative text-negative-foreground pressable [--press-scale:0.98]",
        plain:
          "rounded-button bg-card text-card-foreground shadow-card pressable [--press-scale:0.98]",
        // The catalogue's "ghost" role is heroGhost here, to avoid clashing
        // with shadcn's generic "ghost" variant (hover-only). Only over --hero.
        heroGhost:
          "rounded-button bg-white/10 text-hero-foreground pressable [--press-scale:0.98]",
      },
      size: {
        "default":
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        "xs": "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        "sm": "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        "lg": "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        "icon": "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        // State-button height/typography (48–54 in the catalogue, reduced
        // to two steps: role — standard (50), role-lg — large (54,
        // login screen).
        "role": "h-[50px] gap-2 px-6 text-base font-580",
        "role-lg": "h-[54px] gap-2 px-6 text-list-row font-580",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = Omit<ButtonPrimitiveProps, "className">
  & RefAttributes<HTMLButtonElement>
  & VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export const Button = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) => (
  <ButtonPrimitive
    data-slot="button"
    data-variant={variant}
    data-size={size}
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
);

type LinkButtonProps = Omit<LinkPrimitiveProps, "className">
  & VariantProps<typeof buttonVariants> & {
    className?: string;
  };

// Delegates navigation to next/link via react-aria-components' `render`
// prop (see ADR 0024) so every LinkButton gets client-side routing — the
// launch gate (LaunchGate/LaunchLoading, features/launch-gate, ADR 0017/0019/0028) only runs once, on
// the initial document load, not on every in-app navigation. Restricted to
// internal paths ("/..."): next/link expects an app route, not an
// arbitrary/external href, so anything else (mailto:, tel:, external
// https://...) falls back to a plain <a> (react-aria-components' default).
// Exported — shared/ui/text-link.tsx (ADR 0029) needs the exact same
// internal-vs-external check for its own next/link render prop.
export const isInternalHref = (href: LinkPrimitiveProps["href"]): href is string =>
  typeof href === "string" && href.startsWith("/");

export const LinkButton = ({
  className,
  variant = "default",
  size = "default",
  href,
  ...props
}: LinkButtonProps) => (
  <LinkPrimitive
    data-slot="button"
    data-variant={variant}
    data-size={size}
    href={href}
    className={cn(buttonVariants({ variant, size, className }))}
    render={
      // react-aria-components' Link can render as a plain <span> when
      // there's no href (onPress-only links) — "href" in linkProps is its
      // own documented way to narrow which case this is.
      isInternalHref(href)
        ? (linkProps) =>
            "href" in linkProps
              ? <NextLink {...linkProps} href={href} />
              : <span {...linkProps} />
        : undefined
    }
    {...props}
  />
);

export { buttonVariants };
