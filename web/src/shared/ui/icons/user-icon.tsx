import type { IconProps } from "./icon-props";

// The bottom navigation's family, variant N2 of the menu mock-ups. Drawn
// by Tabler Icons (MIT) — icons/outline/user.svg — and copied in as a
// component rather than taken as a dependency: the app needs five of
// them, the project's rule is that an icon is its own component with
// `size`/`className`/currentColor (ADR 0011), and @tabler/icons-react
// would be a package in the bundle for four files.
//
// Kept at Tabler's own geometry: a 24 grid and stroke 2. `fill="none"` is
// the attribute, so a class can override it — which is what the active
// state does, filling the shape with the primary colour at low opacity
// (the "duotone" marker) instead of putting a plate behind the icon.
export const UserIcon = ({ size = 24, className, ...props }: IconProps) => (
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
    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
    <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
  </svg>
);
