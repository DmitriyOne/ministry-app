"use client";

import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { composeRenderProps, Input as InputPrimitive } from "react-aria-components";

type InputProps = ComponentProps<typeof InputPrimitive>;

export const Input = ({ className, type, ...props }: InputProps) => (
  <InputPrimitive
    type={type}
    data-slot="input"
    className={composeRenderProps(className, (resolvedClassName) =>
      cn(
        // No focus ring and no error ring, removed HERE rather than
        // cancelled at each call site. Overriding them downstream does not
        // work: the utilities stay on the element and Tailwind still emits
        // their CSS, because it generates a rule for every class it finds in
        // the sources. The shadcn issue threads land in the same place —
        // edit the component, do not pile overrides on it.
        //
        // The error BORDER stays: PillForm (the waitlist field) relies on it
        // as its only error signal, and it is a border, not a ring. Focus
        // there is its own `focus-visible:border-hero`, so nothing above was
        // carrying it. Inside a FieldCard neither applies — see ADR 0013's
        // amendment, including what that costs.
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-negative md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
        resolvedClassName,
      ),
    )}
    {...props}
  />
);
