import type { IconProps } from "./icon-props";

// Own drawing (not in the mock-up, which used a plain "+" text glyph on
// the Day row's tile — replaced with an SVG so it never needs a
// dictionary entry for a single symbol, see ADR 0029).
export const PlusIcon = ({ size = 18, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M10 4.5v11M4.5 10h11" />
  </svg>
);
