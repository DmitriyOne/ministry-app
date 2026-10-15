import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/shared/ui/alert";
import { cn } from "@/shared/lib/cn";

// A light plate with an icon in its own grid column — the form-level
// message that is not a toast (ADR 0046: only what someone has to act on
// stays on the screen).
//
// Why a named component and not the raw @shadcn/alert: the same four
// corrections to the registry's defaults (`rounded-xl border-0 px-4
// py-3.5 shadow-card`, plus the caption type on the description) were
// written out at each call site, which is a variant of Alert that this
// project uses everywhere and had never been given a name. The icon
// colour is the subtle part: the registry forces every direct <svg>
// child to currentColor with a selector that outranks a plain class, so
// the tone has to come down as the plate's own colour, and the
// description sets its own.
type NoticeProps = {
  tone: "positive" | "negative";
  icon: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Notice = ({ tone, icon, children, className }: NoticeProps) => (
  <Alert
    variant={tone === "negative" ? "destructive" : "default"}
    className={cn(
      "rounded-xl border-0 px-4 py-3.5 shadow-card",
      tone === "positive" && "text-primary",
      className,
    )}
  >
    {icon}
    <AlertDescription
      className={cn(
        "text-caption font-540",
        tone === "negative" ? "text-negative" : "text-ink-muted",
      )}
    >
      {children}
    </AlertDescription>
  </Alert>
);
