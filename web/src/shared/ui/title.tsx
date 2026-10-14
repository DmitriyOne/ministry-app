import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

// The component catalogue described 4 sizes (26/30/32/36) for four
// state screens — reduced to two per ADR 0012: 32 for mobile
// states (404/500/Coming soon/Login), 30 for Desktop block only.
const SIZE = {
  default: "text-title font-640 tracking-screen-title",
  compact: "text-day-title font-620 tracking-day-title",
} as const;

const TONE = {
  ink: "text-ink",
  hero: "text-hero-foreground",
} as const;

// `children` is required on purpose. Everything here is spread onto the
// tag, so `<Title title="Privacy" />` used to compile into an empty
// `<h1 title="Privacy">`: `title` is a valid attribute on any element, so
// neither TypeScript nor the linter saw anything wrong, and the screen
// simply had no visible heading (found on /privacy). Demanding children
// turns that spelling into a compile error.
type TitleProps = ComponentPropsWithoutRef<"h1"> & {
  children: ReactNode;
  as?: ElementType;
  size?: keyof typeof SIZE;
  tone?: keyof typeof TONE;
};

export const Title = ({
  as: Tag = "h1",
  size = "default",
  tone = "ink",
  className,
  ...props
}: TitleProps) => <Tag className={cn(SIZE[size], TONE[tone], className)} {...props} />;
