import type { IconProps } from "./icon-props";

// Tabler Icons (MIT) — icons/outline/minus.svg. The twin of PlusIcon: the
// hours card puts the two side by side, so they share the 24 grid and the
// stroke 2 of the rest of the family.
export const MinusIcon = ({ size = 24, className, ...props }: IconProps) => (
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
    <path d="M5 12l14 0" />
  </svg>
);
