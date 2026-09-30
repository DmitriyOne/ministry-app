import { cn } from "@/shared/lib/cn";

const TONE = {
  neutral: "bg-ink/6 text-ink-muted",
  alert: "bg-negative/10 text-negative",
} as const;

type StatusGlyphProps = {
  code: string;
  tone?: keyof typeof TONE;
  className?: string;
};

export const StatusGlyph = ({ code, tone = "neutral", className }: StatusGlyphProps) => (
  <div
    className={cn(
      "flex size-26 items-center justify-center rounded-full text-status font-620 tracking-screen-title tabular-nums",
      TONE[tone],
      className,
    )}
  >
    {code}
  </div>
);
