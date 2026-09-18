import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "cn";

const TONE = {
  ink: "text-ink-a50",
  hero: "text-hero-foreground/60",
} as const;

type BodyTextProps = ComponentPropsWithoutRef<"p"> & {
  as?: ElementType;
  tone?: keyof typeof TONE;
};

export const BodyText = ({
  as: Tag = "p",
  tone = "ink",
  className,
  ...props
}: BodyTextProps) => (
  <Tag className={cn("text-body font-500 text-pretty", TONE[tone], className)} {...props} />
);
