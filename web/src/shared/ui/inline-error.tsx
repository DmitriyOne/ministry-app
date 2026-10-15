import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

// Only on --hero (see the component catalogue). It now uses --negative-hero
// for both the text and the border, which is what that token was introduced
// for — globals.css says so in as many words: "ONLY on top of --hero, for
// InlineError on a dark background". It was built with plain --negative
// instead, which measures 1.73:1 against the deep green and read as muddy
// brown; the tint measures 5.44:1.
export const InlineError = ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
  <p
    role="alert"
    aria-live="polite"
    className={cn(
      "inline-block rounded-xs bg-transparent border border-solid border-negative-hero px-3 py-2 text-caption font-540 text-negative-hero",
      className,
    )}
    {...props}
  />
);
