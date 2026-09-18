import type { IconProps } from "./icon-props";

export const ProfileIcon = ({ size = 18, className, ...props }: IconProps) => {
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
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.2 15.9c1-1.9 2.8-3.1 4.8-3.1s3.8 1.2 4.8 3.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
