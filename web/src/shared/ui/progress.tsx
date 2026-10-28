"use client";

import { type ComponentProps, createContext, type ReactNode, useContext, useMemo } from "react";
import {
  Label as LabelPrimitive,
  type LabelProps,
  ProgressBar as ProgressPrimitive,
  type ProgressBarProps as ProgressPrimitiveProps,
} from "react-aria-components";

import { cn } from "@/shared/lib/cn";

// From the shadcn registry (`@shadcn/progress`), with the changes this
// project's rules require, none of them to its behaviour:
//
//  * `import { cn } from "cn"` → `@/shared/lib/cn`. The registry writes
//    the bare package name whatever `components.json` says, and this
//    project must never use it directly (CLAUDE.md, and the same note on
//    shared/ui/skeleton.tsx).
//  * `function` + `React.*` → arrow functions and named imports.
//  * `h-1 bg-muted` → `h-1.5 bg-ink-a09`, and a radius on the indicator
//    as well as the track: 6px and the dividers' tone are what the
//    owner's design asks for (ADR 0064), and `--muted` resolves to the
//    page background here, so the registry's track would be invisible.
//
// Why this and not a `<div>` with a width: the bar states a number
// ("272 of 360 hours"), and RAC's ProgressBar is what turns `value` plus
// `aria-label` into `role="progressbar"` with `aria-valuenow` and
// `aria-valuetext`. It pulls no new dependency — the registry item lists
// `cn` and nothing else.
//
// It is `"use client"`, which the day screen is not. That is why the
// progress block renders it as a LEAF, with the labels and the numbers
// outside it in server-rendered text — the same arrangement as FooterLink
// inside ScreenFooter and BottomNavItem inside BottomNav. Used that way
// the context below carries nothing anybody reads, and ProgressLabel and
// ProgressValue have no caller; they are kept because they are part of
// the registry's API, the same reason button.tsx keeps its `destructive`
// variant.
type ProgressContextValue = {
  percentage?: number;
  isIndeterminate: boolean;
  valueText?: string;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

const useProgress = () => {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgress must be used within a Progress.");
  }

  return context;
};

const ProgressContent = ({
  children,
  percentage,
  isIndeterminate,
  valueText,
}: ProgressContextValue & {
  children?: ReactNode;
}) => {
  const context = useMemo(
    () => ({ percentage, isIndeterminate, valueText }),
    [percentage, isIndeterminate, valueText],
  );

  return (
    <ProgressContext value={context}>
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressContext>
  );
};

export const Progress = ({
  className,
  children,
  ...props
}: Omit<ProgressPrimitiveProps, "children" | "className"> & {
  children?: ReactNode;
  className?: string;
}) => (
  <ProgressPrimitive
    data-slot="progress"
    className={cn("flex flex-wrap gap-3", className)}
    {...props}
  >
    {({ percentage, valueText, isIndeterminate }) => (
      <ProgressContent
        percentage={percentage}
        valueText={valueText}
        isIndeterminate={isIndeterminate}
      >
        {children}
      </ProgressContent>
    )}
  </ProgressPrimitive>
);

// The track's own look is repeated by hand in the day screen's skeleton
// (pages/day/ui/DayScreenSkeleton.tsx): an empty track IS what a bar
// looks like before its number arrives. Sharing the string would mean
// importing it from this `"use client"` module into a server one, and
// the pair is one line, so it is kept in step by this note and the one
// there (ADR 0064, decision 12).
export const ProgressTrack = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    data-slot="progress-track"
    className={cn(
      "relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full bg-ink-a09",
      className,
    )}
    {...props}
  />
);

export const ProgressIndicator = ({ className, style, ...props }: ComponentProps<"span">) => {
  const { percentage, isIndeterminate } = useProgress();

  return (
    <span
      data-slot="progress-indicator"
      className={cn("h-full rounded-full bg-primary transition-all", className)}
      style={{
        ...style,
        width: `${isIndeterminate ? 100 : (percentage ?? 0)}%`,
      }}
      {...props}
    />
  );
};

export const ProgressLabel = ({ className, ...props }: LabelProps) => (
  <LabelPrimitive
    data-slot="progress-label"
    className={cn("text-sm font-medium", className)}
    {...props}
  />
);

export const ProgressValue = ({
  className,
  children,
  ...props
}: Omit<ComponentProps<"span">, "children"> & {
  children?: (value: string) => ReactNode;
}) => {
  const { valueText } = useProgress();

  return (
    <span
      data-slot="progress-value"
      className={cn("ml-auto text-sm text-ink-faint tabular-nums", className)}
      {...props}
    >
      {children && valueText != null ? children(valueText) : valueText}
    </span>
  );
};
