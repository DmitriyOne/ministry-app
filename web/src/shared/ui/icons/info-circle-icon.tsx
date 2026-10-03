import type { IconProps } from "./icon-props";

export const InfoCircleIcon = ({ size = 24, ...props }: IconProps) => (
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
    <path d="M12 10.5v5" />
    <path d="M12 7.5h.01" />
  </svg>
);
