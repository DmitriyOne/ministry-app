import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

export const Caption = ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
  <p className={cn("text-caption font-520 text-ink-faint tabular-nums", className)} {...props} />
);
