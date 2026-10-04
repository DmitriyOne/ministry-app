import type { IconProps } from "./icon-props";

export const LockOpenIcon = ({ size = 20, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M6 19V11C6 10.4477 6.44772 10 7 10H17C17.5523 10 18 10.4477 18 11V19C18 19.5523 17.5523 20 17 20H7C6.44772 20 6 19.5523 6 19Z"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="15" r="2" strokeLinejoin="round" />
    <path
      d="M16 10V6.5C16 5.11929 17.1193 4 18.5 4V4V4C19.8807 4 21 5.11929 21 6.5V10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
