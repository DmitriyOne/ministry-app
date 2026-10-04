import type { ComponentPropsWithoutRef, ElementType } from "react";
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

type TitleProps = ComponentPropsWithoutRef<"h1"> & {
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
