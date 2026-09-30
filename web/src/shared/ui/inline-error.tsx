import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

// Only on --hero (see the component catalogue): --negative-hero is
// lighter than the regular terracotta, so it stays legible on the
// dark-green background.
export const InlineError = ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
  <p
    role="alert"
    aria-live="polite"
    className={cn(
      "inline-block rounded-xs bg-transparent border border-solid border-negative px-3 py-2 text-caption font-540 text-negative",
      className,
    )}
    {...props}
  />
);
