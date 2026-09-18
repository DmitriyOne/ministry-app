import type { ComponentPropsWithoutRef } from "react";
import { cn } from "cn";

// Только на --hero (см. каталог компонентов): --negative-hero — светлее
// обычной терракоты, читаема на тёмно-зелёном фоне.
export const InlineError = ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
  <p
    role="alert"
    aria-live="polite"
    className={cn(
      "inline-block rounded-xs bg-hero px-3 py-2 text-caption font-540 text-negative-hero",
      className,
    )}
    {...props}
  />
);
