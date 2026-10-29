import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";
import { AlertCircleIcon } from "@/shared/ui/icons";

// The form-level message on --hero: what the server refused, said on the
// dark green of /login, /forgot-password and the device shields.
//
// A FILLED plate, not an outline (the owner, 2026-10-29). It was a
// transparent box with a --negative-hero border and nothing else, and
// three things were wrong with it at once: the radius (12) matched
// neither the buttons under it (17) nor the field card above it (22), so
// an empty rounded rectangle in that column read as one more control
// that happened to be dead; the terracotta TINT, which exists because
// plain terracotta measures 1.73:1 on this green, came out looking
// washed out next to the saturated surfaces around it; and the colour
// was the only thing saying "error", with no sign to carry the meaning
// for anyone who does not read it as one.
//
// So the tone moved from the letters to the plate: --negative fills it
// and --negative-foreground writes on it, which is 5.76:1 — the contrast
// problem that produced the tint belongs to terracotta TEXT on green,
// and a terracotta SURFACE never had it. --negative-hero stays where it
// is still right (PaceCard's gradient).
export const InlineError = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) => (
  <div
    role="alert"
    aria-live="polite"
    className={cn(
      "flex items-start gap-2.5 rounded-md bg-negative px-4 py-3.5 text-negative-foreground",
      className,
    )}
    {...props}
  >
    {/* aria-hidden by default, like every icon of ours: the words next
        to it say the same thing. */}
    <AlertCircleIcon size={18} className="mt-px shrink-0" />
    <p className="text-caption font-540">{children}</p>
  </div>
);
