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
  // of claiming the screen's height for itself, which would push the
  // footer below the fold. Screens outside that group (login, forgot
  // password, 404/500/access/*) leave this at the default — there, this
  // <main> is the only element establishing the screen's height, so it
  // keeps min-h-app.
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
    // Read by one rule in globals.css, which paints the DOCUMENT in the
    // same colour. That rule is what fills the status-bar area of the
    // installed app and the overscroll rubber-band: neither of them is
    // this element, and both take their colour from <html>/<body>.
    // Emitted from the `background` prop rather than from a new one, so a
    // screen cannot say "deep" and forget to say it twice.
    data-screen-tone={background === "deep" ? "hero" : undefined}
    className={cn(
      "flex flex-col items-center justify-center gap-6.5 px-8 py-10 text-center",
      // min-h-app, not min-h-dvh: on iOS the layout viewport keeps its
      // full height while the keyboard covers the bottom of it, so a
      // screen with a field (login, forgot password) laid itself out
      // behind the keyboard. The utility subtracts the measured keyboard
      // height and falls back to plain 100dvh when there is none.
      fill ? "flex-1" : "min-h-app",
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
