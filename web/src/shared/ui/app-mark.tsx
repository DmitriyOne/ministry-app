import { cn } from "@/shared/lib/cn";

import { AppMarkIcon } from "@/shared/ui/icons";

// Radius grows with size (component catalogue): 14 / 16 / 18 / 24.
const SIZE = {
  44: { box: "size-11", radius: "rounded-mark-sm", icon: 24 },
  52: { box: "size-13", radius: "rounded-mark-md", icon: 30 },
  56: { box: "size-14", radius: "rounded-md", icon: 32 },
  88: { box: "size-22", radius: "rounded-mark-lg", icon: 40 },
} as const;

const TONE = {
  // Light background — deep green tile.
  solid: "bg-hero",
  // Green background — white tile at 0.12 opacity.
  translucent: "bg-white/12",
} as const;

type AppMarkProps = {
  size?: keyof typeof SIZE;
  tone?: keyof typeof TONE;
  elevated?: boolean;
  // The mark almost always sits next to visible text (a screen title) —
  // decorative by default. Pass label when AppMark is the sole
  // logo with no adjacent text (e.g. a future favicon-like case).
  label?: string;
  className?: string;
};

export const AppMark = ({
  size = 44,
  tone = "solid",
  elevated = false,
  label,
  className,
}: AppMarkProps) => {
  const { box, radius, icon } = SIZE[size];

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "flex items-center justify-center",
        box,
        radius,
        TONE[tone],
        elevated && "shadow-mark-elevated",
        className,
      )}
    >
      <AppMarkIcon size={icon} className="text-white" />
    </div>
  );
};
