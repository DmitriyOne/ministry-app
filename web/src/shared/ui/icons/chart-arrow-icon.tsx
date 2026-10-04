import type { IconProps } from "./icon-props";

export const ChartArrowIcon = ({ size = 20, className, ...props }: IconProps) => (
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
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M3 17h18" />
    <path d="M6.5 13.5 10.5 9l3.2 3 4.3-5.4" />
    <path d="M18 6.6h-3.3M18 6.6v3.2" />
  </svg>
);
