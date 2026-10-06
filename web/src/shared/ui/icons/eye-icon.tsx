import type { IconProps } from "./icon-props";

type EyeIconProps = IconProps & {
  // Draws the diagonal strike-through: the "password is hidden" state.
  crossed?: boolean;
};

export const EyeIcon = ({ size = 21, crossed = false, className, ...props }: EyeIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3.1" />
    {crossed ? <path d="M4 20 20 4" /> : null}
  </svg>
);
