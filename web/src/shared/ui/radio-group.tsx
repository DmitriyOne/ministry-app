"use client";

import {
  composeRenderProps,
  RadioGroup as RadioGroupPrimitive,
  Radio as RadioPrimitive,
  type RadioGroupProps,
  type RadioProps,
} from "react-aria-components";

import { cn } from "@/shared/lib/cn";

// Vendored from the shadcn registry (@shadcn/radio-group, aria-nova), no
// new npm dependencies — it is built on react-aria-components, the stack
// this project already uses (ADR 0012/0013). Adapted the way every
// vendored file is: arrow functions, cn from @/shared/lib/cn, and the
// dark: variants dropped (there is no dark theme, ADR 0011).
//
// Every ring class is removed at source, as in input.tsx and
// input-group.tsx: ADR 0013's amendment took focus and error rings out of
// the project's controls, and a registry file is the one place they creep
// back in. What marks a chosen option here is the filled dot and the
// border colour, and focus is visible because the border changes too.
export const RadioGroup = ({ className, ...props }: RadioGroupProps) => (
  <RadioGroupPrimitive
    data-slot="radio-group"
    className={cn("grid w-full gap-2", className)}
    {...props}
  />
);

export const RadioGroupItem = ({ className, children, ...props }: RadioProps) => (
  <RadioPrimitive
    data-slot="radio-group-item"
    className={cn(
      // after:-inset-* is the registry's touch target: the dot is 16px,
      // the tappable area is not.
      "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-focus-visible:border-primary data-selected:border-primary data-selected:bg-primary data-selected:text-primary-foreground",
      className,
    )}
    {...props}
  >
    {composeRenderProps(children, (children, { isSelected }) => (
      <>
        <span data-slot="radio-group-indicator" className="flex size-4 items-center justify-center">
          {isSelected && (
            <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
          )}
        </span>
        {children}
      </>
    ))}
  </RadioPrimitive>
);
