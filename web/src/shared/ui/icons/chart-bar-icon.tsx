import type { IconProps } from "./icon-props";

// The bottom navigation's family, variant N2 of the menu mock-ups. Drawn
// by Tabler Icons (MIT) — icons/outline/chart-bar.svg — and copied in as a
// component rather than taken as a dependency: the app needs five of
// them, the project's rule is that an icon is its own component with
// `size`/`className`/currentColor (ADR 0011), and @tabler/icons-react
// would be a package in the bundle for four files.
//
// Kept at Tabler's own geometry: a 24 grid and stroke 2. `fill="none"` is
// the attribute, so a class can override it — which is what the active
// state does, filling the shape with the primary colour at low opacity
// (the "duotone" marker) instead of putting a plate behind the icon.
export const ChartBarIcon = ({ size = 24, className, ...props }: IconProps) => (
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
    <path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6" />
    <path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10" />
    <path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14" />
    <path d="M4 20h14" />
  </svg>
);
