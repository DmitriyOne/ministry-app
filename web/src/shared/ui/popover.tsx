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
  // What the bubble is standing on. Dark on the warm background of the
  // screen; white on the filled --hero cards, where a --hero bubble
  // disappeared into the card it was explaining — the owner caught it
  // on the phone.
  tone?: "dark" | "light";
  children: ReactNode;
};

const TONE = {
  dark: "bg-hero text-hero-foreground/90",
  light: "bg-card text-ink",
} as const;

const ARROW_TONE = {
  dark: "fill-hero",
  light: "fill-card",
} as const;

export const Popover = ({
  className,
  label,
  tone = "dark",
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
    // A hint is not a modal. By default react-aria makes everything
    // behind a popover inert and locks the page: the screen stops
    // scrolling, and a tap on anything else is spent closing the
    // bubble instead of doing what it says. Measured in the browser —
    // Playwright refused to press the next sign, "element is inert",
    // which is exactly what a thumb would hit.
    //
    // Non-modal keeps the dismissal (a tap outside, Escape, scroll) and
    // gives back the page: the sign beside it opens its own bubble on
    // the first tap, and the list underneath still scrolls.
    isNonModal
    containerPadding={16}
    // How close the tail may come to a corner of the bubble: the radius
    // of the bubble, which is where its straight edge begins. Without
    // it the tail sat on the curve and ate into it.
    //
    // The number is not free. Measured on the phone width: a sign at
    // the right-hand end of a row — which is every sign here — leaves
    // 18px between the centre of the glyph and the right edge of the
    // bubble. The tail needs radius + half its own width to clear the
    // corner, so 20 + 7 pushed it 9px off the glyph it is supposed to
    // point at. 12 + 6 is exactly 18: the tail clears the curve AND
    // stands under the sign. Changing the radius or the tail's width
    // without redoing this sum brings the squint back.
    arrowBoundaryOffset={12}
    className={cn(
      "z-50 max-w-72 rounded-xs px-4 py-3 text-caption font-500 text-pretty shadow-nav outline-hidden",
      TONE[tone],
      "duration-100 data-entering:animate-in data-entering:fade-in-0 data-entering:zoom-in-95 data-exiting:animate-out data-exiting:fade-out-0 data-exiting:zoom-out-95",
      "data-[placement=bottom]:slide-in-from-top-1 data-[placement=top]:slide-in-from-bottom-1",
      className,
    )}
    {...props}
  >
    <OverlayArrow className="group">
      {/* `block`, and this is not a detail: an inline <svg> sits on the
          text baseline, which left the tail floating a couple of pixels
          above the bubble with daylight between them — what the owner
          saw on the phone.

          The pixel of overlap goes with it. Two shapes meeting exactly
          edge to edge still show a hairline when the browser
          antialiases them, so the tail is pushed into the bubble by 1px
          and the join disappears.

          Rotated by placement, which is what keeps the tail pointing at
          the sign after react-aria has flipped the bubble above it; the
          translate is written for both directions because Tailwind
          applies it before the rotation, in the element's own space. */}
      <svg
        width={12}
        height={6}
        viewBox="0 0 12 6"
        className={cn(
          "block translate-y-px group-data-[placement=top]:-translate-y-px group-data-[placement=top]:rotate-180",
          ARROW_TONE[tone],
        )}
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
