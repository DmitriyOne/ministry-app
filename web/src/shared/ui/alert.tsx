import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

// Vendored from the shadcn registry (@shadcn/alert, aria-nova), adapted to
// the project's code style: arrow functions, no `import * as React`, and
// cn from @/shared/lib/cn rather than the bare package (CLAUDE.md — the
// package's own class groups do not know this project's tokens). The
// layout is the registry's — the icon sits in its own grid column, so a
// plate with a mark on the left needs none of our own — with two changes
// noted where they are made.
const alertVariants = cva(
  // Two changes to the registry's own CSS, both about a plate that holds
  // one line: `items-center` so the mark sits on the text's centre line
  // rather than on the grid row's top edge, and the registry's
  // `*:[svg]:translate-y-0.5` dropped — a 2px nudge meant for a title
  // plus description, which reads as misalignment with a single line.
  "group/alert relative grid w-full items-center gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type AlertProps = ComponentProps<"div"> & VariantProps<typeof alertVariants>;

export const Alert = ({ className, variant, ...props }: AlertProps) => (
  <div
    data-slot="alert"
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
);

export const AlertTitle = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="alert-title"
    className={cn(
      "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
      className,
    )}
    {...props}
  />
);

export const AlertDescription = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="alert-description"
    className={cn(
      "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
      className,
    )}
    {...props}
  />
);

export const AlertAction = ({ className, ...props }: ComponentProps<"div">) => (
  <div data-slot="alert-action" className={cn("absolute top-2 right-2", className)} {...props} />
);
