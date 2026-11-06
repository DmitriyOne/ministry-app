"use client";

import type { ReactNode } from "react";
import {
  Dialog as DialogPrimitive,
  OverlayArrow,
  Popover as PopoverPrimitive,
  type PopoverProps as PopoverPrimitiveProps,
} from "react-aria-components";

import { cn } from "@/shared/lib/cn";

// Vendored from the shadcn registry (@shadcn/popover, aria-nova), no new
// npm dependencies — it is built on react-aria-components, which this
// project already uses (ADR 0012/0013). react-aria is the reason not to
// write this by hand: it measures the trigger, flips the bubble when it
// would not fit, keeps it inside the viewport, closes it on Escape, on a
// tap outside and on scroll, and moves focus into it and back out.
//
// Adapted the way every vendored file is: arrow functions, our `cn`, no
// dark variants (ADR 0011), no rings (ADR 0013), project tokens instead
// of the registry's `text-sm`/`bg-popover`/`ring-foreground/10`. The
// registry's PopoverHeader/PopoverTitle/PopoverDescription are dropped —
// each was a div with one class, and the one caller (InfoHint) has no
// heading to show.
//
// The arrow is ours: the registry ships none, and a bubble with no tail
// beside a small sign reads as a card that happened to land there.
type PopoverProps = Omit<PopoverPrimitiveProps, "className" | "children"> & {
  className?: string;
  // The accessible name of the bubble itself, which react-aria requires
  // on the dialog inside it.
  label: string;
  children: ReactNode;
};

export const Popover = ({
  className,
  label,
  children,
  placement = "bottom end",
  offset = 8,
  ...props
}: PopoverProps) => (
  <PopoverPrimitive
    data-slot="popover-content"
    placement={placement}
    offset={offset}
    // The gutter the owner asked for: the bubble keeps 16px from every
    // edge of the screen rather than sitting against it. react-aria calls
    // this containerPadding and applies it while placing and while
    // flipping, so it holds for a sign at the far right of a row as well
    // — which is where every one of them sits.
    containerPadding={16}
    className={cn(
      "z-50 max-w-72 rounded-lg bg-hero px-4 py-3 text-caption font-500 text-hero-foreground/90 text-pretty shadow-nav outline-hidden",
      "duration-100 data-entering:animate-in data-entering:fade-in-0 data-entering:zoom-in-95 data-exiting:animate-out data-exiting:fade-out-0 data-exiting:zoom-out-95",
      "data-[placement=bottom]:slide-in-from-top-1 data-[placement=top]:slide-in-from-bottom-1",
      className,
    )}
    {...props}
  >
    <OverlayArrow className="group">
      {/* Rotated by placement, which is what makes the tail point at the
          sign after react-aria has flipped the bubble above it. */}
      <svg
        width={12}
        height={6}
        viewBox="0 0 12 6"
        className="fill-hero group-data-[placement=top]:rotate-180"
        aria-hidden="true"
      >
        <path d="M6 0 12 6H0z" />
      </svg>
    </OverlayArrow>

    <DialogPrimitive aria-label={label} className="outline-hidden">
      {children}
    </DialogPrimitive>
  </PopoverPrimitive>
);
