import type { IconProps } from "./icon-props";

export const WifiOffIcon = ({ size = 24, ...props }: IconProps) => (
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
    <path d="M2.75 8.7A15.1 15.1 0 0 1 6.2 6.55" />
    <path d="M10.1 5.08A15.4 15.4 0 0 1 21.25 8.7" />
    <path d="M5.6 12.05a10.2 10.2 0 0 1 3.15-1.75" />
    <path d="M12.4 9.82a10.25 10.25 0 0 1 6 2.23" />
    <path d="M8.7 15.35a5.15 5.15 0 0 1 6.6 0" />
    <circle
      cx="12"
      cy="18.6"
      r="0.9"
      fill="currentColor"
      stroke="none"
    />
    <path d="M3.5 3.5 20.5 20.5" />
  </svg>
);
