import type { IconProps } from "./icon-props";

export function YearIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="4.6" y="9.6" width="2.9" height="5" rx="1.45" fill="currentColor" />
      <rect x="8.55" y="6.6" width="2.9" height="8" rx="1.45" fill="currentColor" />
      <rect x="12.5" y="3.8" width="2.9" height="10.8" rx="1.45" fill="currentColor" />
      <path
        d="M3.2 16.7h13.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
