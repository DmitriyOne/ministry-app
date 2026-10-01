import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

// A single-state screen (404, 500, Coming soon): everything centred on
// both axes, slots glyph → text → actions → footnote.
type CenteredStateProps = {
  background?: "warm" | "deep";
  glyph?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  footnote?: ReactNode;
  className?: string;
  // When true, this <main> sits inside a flex-column ancestor that
  // already reserves the full viewport height and has a footer after it
  // (the (with-footer) route group's layout — ADR 0029): the main grows
  // to fill whatever space is left above the footer via flex-1, instead
  // of claiming min-h-dvh for itself, which would push the footer below
  // the fold. Screens outside that group (404/500/access/*) leave this
  // at the default — there, this <main> is the only element
  // establishing the screen's height, so it keeps min-h-dvh.
  fill?: boolean;
};

export const CenteredState = ({
  background = "warm",
  glyph,
  children,
  actions,
  footnote,
  className,
  fill = false,
}: CenteredStateProps) => (
  <main
    className={cn(
      "flex flex-col items-center justify-center gap-6.5 px-8 py-10 text-center",
      fill ? "flex-1" : "min-h-dvh",
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
