import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

// From the shadcn registry (`@shadcn/skeleton`), with three changes the
// project's rules require, none of them to its behaviour:
//
//  * `import { cn } from "cn"` → `@/shared/lib/cn`. The registry writes
//    the bare package name; this project must never use it directly,
//    because that package classifies classes against stock Tailwind and
//    puts our custom tokens in the wrong conflict groups (CLAUDE.md).
//  * `function` + `React.ComponentProps` → arrow function and a named
//    type import, like every other file here.
//  * `bg-muted` → `bg-ink-a09`. The registry's default is a warm grey,
//    and this project's `--muted` resolves to the page background, so a
//    skeleton on a white card would be all but invisible. `--ink-a09` is
//    the tone the list rows already use for their dividers, so a plate
//    reads as part of the card rather than as a new colour. On the deep
//    green header the call site passes `bg-white/15` instead.
//
// `animate-pulse` is kept exactly as it came: opacity 1 → 0.5 → 1 over
// 2s. That is the owner's choice (a sweeping highlight was tried and
// rejected), and keeping the registry's own animation means there is
// nothing bespoke here to maintain.
export const Skeleton = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="skeleton"
    className={cn("animate-pulse rounded-md bg-ink-a09", className)}
    {...props}
  />
);
