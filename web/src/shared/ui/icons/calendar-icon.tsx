import type { IconProps } from "./icon-props";

export function CalendarIcon({ size = 18, className, ...props }: IconProps) {
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
      <rect
        x="2.3"
        y="4.2"
        width="15.4"
        height="13.5"
        rx="4.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M2.7 8.7h14.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.8 2.5v2.3M13.2 2.5v2.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="6.9" cy="12.2" r="0.95" fill="currentColor" />
      <circle cx="10" cy="12.2" r="0.95" fill="currentColor" />
      <circle cx="13.1" cy="12.2" r="0.95" fill="currentColor" />
      <circle cx="6.9" cy="15.2" r="0.95" fill="currentColor" />
      <circle cx="10" cy="15.2" r="0.95" fill="currentColor" />
    </svg>
  );
}
