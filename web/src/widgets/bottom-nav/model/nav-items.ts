import type { ReactElement } from "react";

import type { getTranslations } from "next-intl/server";

import { routes, type AppRoute } from "@/shared/config";
import {
  CalendarIcon,
  type IconProps,
  MonthIcon,
  PlusIcon,
  ProfileIcon,
  YearIcon,
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
};

// The order is the order on screen. A sixth item is added here, not in
// ui/BottomNav.tsx — same approach as the footer's link list.
export const navItems: NavItem[] = [
  { href: routes.calendar, labelKey: "calendar", Icon: CalendarIcon },
  { href: routes.month, labelKey: "month", Icon: MonthIcon },
  { href: routes.day, labelKey: "day", Icon: PlusIcon, isPrimary: true },
  { href: routes.year, labelKey: "year", Icon: YearIcon },
  { href: routes.profile, labelKey: "profile", Icon: ProfileIcon },
];
