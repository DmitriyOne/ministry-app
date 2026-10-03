import type { IconProps } from "./icon-props";

export const CheckCircleIcon = ({ size = 24, ...props }: IconProps) => (
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
    <path d="m8.5 12 2.25 2.25 4.75-5" />
  </svg>
);
