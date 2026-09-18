import type { ReactNode } from "react";
import { cn } from "cn";

// Экран одного состояния (404, 500, Coming soon): всё по центру по обеим
// осям, слоты glyph → текст → действия → сноска.
type CenteredStateProps = {
  background?: "warm" | "deep";
  glyph?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  footnote?: ReactNode;
  className?: string;
};

export const CenteredState = ({
  background = "warm",
  glyph,
  children,
  actions,
  footnote,
  className,
}: CenteredStateProps) => (
  <main
    className={cn(
      "flex min-h-dvh flex-col items-center justify-center gap-6.5 px-8 py-10 text-center",
      background === "warm" ? "bg-background text-ink" : "bg-hero text-hero-foreground",
      className,
    )}
  >
    {glyph}
    {children}
    {actions}
    {footnote}
  </main>
);
