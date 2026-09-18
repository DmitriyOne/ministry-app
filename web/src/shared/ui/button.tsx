"use client";

import type { RefAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import {
  Button as ButtonPrimitive,
  Link as LinkPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        // Роли из каталога компонентов (ADR 0012) — экраны-состояния.
        // Радиус/высота задаются через size="role"/"role-lg", не через
        // size-варианты выше.
        deep: "rounded-button bg-hero text-hero-foreground pressable [--press-scale:0.98]",
        action:
          "rounded-button bg-primary text-primary-foreground pressable [--press-scale:0.98]",
        alert:
          "rounded-button bg-negative text-negative-foreground pressable [--press-scale:0.98]",
        plain:
          "rounded-button bg-card text-card-foreground shadow-card pressable [--press-scale:0.98]",
        // Роль "ghost" каталога — heroGhost, чтобы не конфликтовать с
        // generic-вариантом shadcn "ghost" (hover-only, уже используется
        // на /styleguide). Только поверх --hero.
        heroGhost:
          "rounded-button bg-white/10 text-hero-foreground pressable [--press-scale:0.98]",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        // Высота/типографика кнопки-состояния (48–54 в каталоге, сведены к
        // двум шагам: role — стандартная (50), role-lg — крупная (54,
        // экран входа).
        role: "h-[50px] gap-2 px-6 text-base font-580",
        "role-lg": "h-[54px] gap-2 px-6 text-list-row font-580",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = Omit<ButtonPrimitiveProps, "className"> &
  RefAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export const Button = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) => (
  <ButtonPrimitive
    data-slot="button"
    data-variant={variant}
    data-size={size}
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
);

type LinkButtonProps = Omit<LinkPrimitiveProps, "className"> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export const LinkButton = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: LinkButtonProps) => (
  <LinkPrimitive
    data-slot="button"
    data-variant={variant}
    data-size={size}
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
);

export { buttonVariants };
