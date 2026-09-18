"use client";

import type { ComponentProps } from "react";
import { cn } from "cn";
import { Separator as SeparatorPrimitive } from "react-aria-components";

type SeparatorProps = ComponentProps<typeof SeparatorPrimitive>;

export const Separator = ({ className, orientation = "horizontal", ...props }: SeparatorProps) => (
  <SeparatorPrimitive
    data-slot="separator"
    orientation={orientation}
    className={cn(
      "block shrink-0 border-0 bg-border aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=vertical]:w-px aria-[orientation=vertical]:self-stretch [:is(hr)]:h-px [:is(hr)]:w-full",
      className,
    )}
    {...props}
  />
);
