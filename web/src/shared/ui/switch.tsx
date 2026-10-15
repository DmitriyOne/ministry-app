"use client";

import {
  composeRenderProps,
  Switch as SwitchPrimitive,
  type SwitchProps,
} from "react-aria-components";

import { cn } from "@/shared/lib/cn";

// Vendored from the shadcn registry (@shadcn/switch, aria-nova), no new
// npm dependencies — react-aria-components again, which is what makes it
// a switch rather than a styled checkbox: role, state, keyboard, and the
// label wiring come from the primitive.
//
// Adapted as every vendored file is: arrow function, our `cn`, no dark
// variants (ADR 0011), the registry's two sizes collapsed to one. The
// registry's 32×18 is a desktop control; this is a phone, and a row in a
// settings card wants something a thumb can hit — 52×32 with a 28 thumb,
// the proportions iOS uses.
//
// The off state carries a border as well as a fill. Apple's own off
// track is barely darker than the card, and for a control whose whole
// job is to say which of two states it is in, "barely" is how it reads
// as broken rather than as off.
export const Switch = ({ className, children, ...props }: SwitchProps) => (
  <SwitchPrimitive
    data-slot="switch"
    className={cn(
      "group/switch relative inline-flex h-8 w-13 shrink-0 items-center rounded-full border border-ink-a09 bg-ink-a09 p-0.5 outline-none transition-colors data-disabled:opacity-50 data-focus-visible:ring-2 data-focus-visible:ring-ring data-selected:border-primary data-selected:bg-primary",
      className,
    )}
    {...props}
  >
    {composeRenderProps(children, (children) => (
      <>
        <span
          data-slot="switch-thumb"
          className="pointer-events-none block size-7 rounded-full bg-card shadow-card transition-transform group-data-selected/switch:translate-x-5"
        />
        {children}
      </>
    ))}
  </SwitchPrimitive>
);
