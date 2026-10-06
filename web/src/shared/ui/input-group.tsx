"use client";

import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Group, type GroupProps } from "react-aria-components";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

// Vendored from the shadcn registry (@shadcn/input-group, aria-nova), with
// project adjustments:
// - InputGroupTextarea is dropped (the project has no Textarea yet).
// - The registry draws focus with has-[...:focus-visible] and the invalid
//   state with has-[[aria-invalid=true]]. Both selectors out-rank a plain
//   data-attribute class, so a focused invalid group would flip to the focus
//   colours. ADR 0013 wants one source for the error styling: `data-invalid`
//   on the wrapper (react-aria's Group sets it from `isInvalid`), with
//   focus-within listed BEFORE data-[invalid=true] so the error wins. The
//   control inside keeps aria-invalid purely as semantics.
export const InputGroup = ({ className, ...props }: GroupProps) => (
  <Group
    data-slot="input-group"
    className={cn(
      "group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input transition-colors outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[invalid=true]:border-negative data-[invalid=true]:ring-3 data-[invalid=true]:ring-negative/20 has-disabled:bg-input/50 has-disabled:opacity-50 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
      className,
    )}
    {...props}
  />
);

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-2 has-[>button]:ml-[-0.3rem]",
        "inline-end": "order-last pr-2 has-[>button]:mr-[-0.3rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

type InputGroupAddonProps = ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>;

export const InputGroupAddon = ({
  className,
  align = "inline-start",
  ...props
}: InputGroupAddonProps) => (
  <div
    role="group"
    data-slot="input-group-addon"
    data-align={align}
    className={cn(inputGroupAddonVariants({ align }), className)}
    onClick={(event) => {
      if ((event.target as HTMLElement).closest("button")) {
        return;
      }
      event.currentTarget.parentElement?.querySelector("input")?.focus();
    }}
    {...props}
  />
);

const inputGroupButtonVariants = cva("flex items-center gap-2 text-sm shadow-none", {
  variants: {
    size: {
      "xs": "h-6 gap-1 rounded-xs px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
      "sm": "",
      "icon-xs": "size-6 rounded-xs p-0 has-[>svg]:p-0",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

type InputGroupButtonProps = Omit<ComponentProps<typeof Button>, "size" | "type">
  & VariantProps<typeof inputGroupButtonVariants> & {
    type?: "button" | "submit" | "reset";
  };

export const InputGroupButton = ({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: InputGroupButtonProps) => (
  <Button
    type={type}
    data-size={size}
    variant={variant}
    className={cn(inputGroupButtonVariants({ size }), className)}
    {...props}
  />
);

export const InputGroupText = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  />
);

export const InputGroupInput = ({ className, ...props }: ComponentProps<typeof Input>) => (
  <Input
    data-slot="input-group-control"
    className={cn(
      "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
      className,
    )}
    {...props}
  />
);
