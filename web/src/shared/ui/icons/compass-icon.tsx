import type { IconProps } from "./icon-props";

// A compass is Safari's own icon — that is the whole point of using it
// where the app tells people to open it in Safari.
export const CompassIcon = ({ size = 24, ...props }: IconProps) => (
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
    <path d="M15.6 8.4 13.5 13.5 8.4 15.6l2.1-5.1Z" />
  </svg>
);
