import type { ComponentPropsWithoutRef } from "react";
import { cn } from "cn";

export const Caption = ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
  <p className={cn("text-caption font-520 text-ink/38 tabular-nums", className)} {...props} />
);
