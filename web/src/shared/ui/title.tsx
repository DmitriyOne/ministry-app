import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "cn";

// Каталог компонентов описывал 4 размера (26/30/32/36) под четыре
// экрана-состояния — сведены к двум по решению из ADR 0012: 32 для
// мобильных состояний (404/500/Coming soon/Вход), 30 — только для
// Desktop block.
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
