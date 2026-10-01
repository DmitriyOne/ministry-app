import type { IconProps } from "./icon-props";

export const MonthIcon = ({ size = 18, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect x="2.4" y="3.2" width="15.2" height="13.6" rx="4.2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6.5" cy="7.1" r="0.9" fill="currentColor" />
    <circle cx="6.5" cy="10" r="0.9" fill="currentColor" />
    <circle cx="6.5" cy="12.9" r="0.9" fill="currentColor" />
    <path
      d="M9.3 7.1h4.4M9.3 10h4.4M9.3 12.9h3.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
