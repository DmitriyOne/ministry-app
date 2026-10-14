import type { IconProps } from "./icon-props";

// The bottom navigation's family, variant N2 of the menu mock-ups. Drawn
// by Tabler Icons (MIT) — icons/outline/calendar-week.svg — and copied in as a
// component rather than taken as a dependency: the app needs five of
// them, the project's rule is that an icon is its own component with
// `size`/`className`/currentColor (ADR 0011), and @tabler/icons-react
// would be a package in the bundle for four files.
//
// Kept at Tabler's own geometry: a 24 grid and stroke 2. `fill="none"` is
// the attribute, so a class can override it — which is what the active
// state does, filling the shape with the primary colour at low opacity
// (the "duotone" marker) instead of putting a plate behind the icon.
export const CalendarWeekIcon = ({ size = 24, className, ...props }: IconProps) => (
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
    <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M4 11h16" />
    <path d="M7 14h.013" />
    <path d="M10.01 14h.005" />
    <path d="M13.01 14h.005" />
    <path d="M16.015 14h.005" />
    <path d="M13.015 17h.005" />
    <path d="M7.01 17h.005" />
    <path d="M10.01 17h.005" />
  </svg>
);
