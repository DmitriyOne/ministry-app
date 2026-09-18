import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "cn";

type SectionLabelProps = ComponentPropsWithoutRef<"h2"> & { as?: ElementType };

// Подписывает раздел контента — семантически заголовок, а не абзац.
export const SectionLabel = ({ as: Tag = "h2", className, ...props }: SectionLabelProps) => (
  <Tag className={cn("text-caption font-600 text-ink-a50", className)} {...props} />
);
