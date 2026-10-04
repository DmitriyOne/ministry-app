import type { IconProps } from "./icon-props";

// An exclamation inside a circle: the bar above the dot, which is what
// separates it from InfoCircleIcon (dot above the bar). Round rather than a
// warning triangle on purpose — it carries the same "this will not work"
// meaning at a lower volume, and sits with the rounded shapes around it.
export const AlertCircleIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5" />
    <path d="M12 16.5h.01" />
  </svg>
);
