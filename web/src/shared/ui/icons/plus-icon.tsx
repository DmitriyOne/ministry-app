import type { IconProps } from "./icon-props";

// Tabler Icons (MIT) — icons/outline/plus.svg. Part of the same family as
// the other four: the navigation's Day button and the about screen's day
// row both use it, so it is drawn on the same 24 grid at stroke 2 as its
// neighbours rather than at the 20/1.6 of the drawing it replaced.
export const PlusIcon = ({ size = 24, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);
