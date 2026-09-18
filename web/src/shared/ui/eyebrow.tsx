import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "cn";

type EyebrowProps = ComponentPropsWithoutRef<"p"> & { as?: ElementType };

export const Eyebrow = ({ as: Tag = "p", className, ...props }: EyebrowProps) => (
  <Tag
    className={cn("text-eyebrow font-600 tracking-eyebrow uppercase text-ink-a40", className)}
    {...props}
  />
);
