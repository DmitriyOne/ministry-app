import type { ReactElement } from "react";

import type { getTranslations } from "next-intl/server";

import { routes, type AppRoute } from "@/shared/config";
import {
  CalendarMonthIcon,
  CalendarWeekIcon,
  ChartBarIcon,
  type IconProps,
  PlusIcon,
  UserIcon,
} from "@/shared/ui/icons";

// Key type derived from the actual translator, not hand-typed — the same
// mechanism widgets/screen-footer/model/footer-links.ts uses, so a
// renamed dictionary key fails typecheck instead of rendering blank.
type NavTranslator = Awaited<ReturnType<typeof getTranslations<"nav">>>;
type NavMessageKey = Parameters<NavTranslator>[0];

export type NavItem = {
  href: AppRoute;
  labelKey: NavMessageKey;
  // A component, not an element: BottomNav is a Server Component and
  // renders it there, handing the finished element to the client leaf
  // (a component type could not cross that boundary, an element can).
  Icon: (props: IconProps) => ReactElement;
  // The raised round button in the middle — one item, and the list says
  // which rather than the markup counting to three.
  isPrimary?: boolean;
  // Does this item own the addresses under its own path? Two do: /day
  // carries the date (/day/2026-06-02, ADR 0063) and /month the month
  // (/month/2026-06, ADR 0066), and without this the menu would light
  // nothing on the screens people actually open. Opt-in per item, so
  // nobody else starts matching by prefix.
  hasFamily?: true;
};

// The order is the order on screen. A sixth item is added here, not in
// ui/BottomNav.tsx — same approach as the footer's link list.
// The icons are the N2 family (Tabler, MIT, copied in as components —
// see shared/ui/icons/calendar-week-icon.tsx): one grid, one stroke
// weight, and shapes closed enough to be filled, which is what marks the
// active item. The project's older drawings stay where they are used, on
// the about screen.
export const navItems: NavItem[] = [
  { href: routes.calendar, labelKey: "calendar", Icon: CalendarWeekIcon },
  { href: routes.month, labelKey: "month", Icon: CalendarMonthIcon, hasFamily: true },
  { href: routes.day, labelKey: "day", Icon: PlusIcon, isPrimary: true, hasFamily: true },
  { href: routes.year, labelKey: "year", Icon: ChartBarIcon },
  { href: routes.profile, labelKey: "profile", Icon: UserIcon },
];
