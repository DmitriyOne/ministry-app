import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

// A short label inside the deep-green hero block: the role on /profile,
// the ministry status beside it. Two tones and nothing else — `quiet`
// for a fact a person already knows about themselves, `filled` for the
// one they came to the screen to check.
//
// Named for the hero rather than called `Pill`, because both tones are
// built on mint, and mint is allowed ONLY on top of --hero (ADR 0011).
// A label on a white card is a different thing and would need different
// colours; it does not belong in this component.
//
// `@shadcn/badge` was the obvious candidate and was looked at (ADR 0012,
// the verdict is recorded there): it brings no new dependency, but every
// dimension differs, all six of its variants would go, and its focus
// rings are the ones ADR 0013 strips from vendored files on every
// `shadcn add`. What would have remained is the `<span>`.
const TONE = {
  quiet: "bg-white/10 text-positive-hero",
  filled: "bg-positive-hero text-hero",
} as const;

type HeroPillProps = ComponentPropsWithoutRef<"span"> & {
  tone?: keyof typeof TONE;
};

export const HeroPill = ({ tone = "quiet", className, ...props }: HeroPillProps) => (
  <span
    className={cn("rounded-sm px-3 py-1.5 text-caption font-600", TONE[tone], className)}
    {...props}
  />
);
