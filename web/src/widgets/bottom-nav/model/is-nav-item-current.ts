// Pulled out of the component so the one comparison the active state
// depends on is provable (is-nav-item-current.test.ts) instead of being
// something to squint at in a browser. Same two rules as
// widgets/screen-footer/ui/FooterLink.tsx:
//
// - usePathname can report a trailing-slash variant depending on routing
//   config, so that must not be what decides the match;
// - the comparison is exact, not a prefix — /month must not light up for
//   a future /month-summary.
export const isNavItemCurrent = (pathname: string, href: string): boolean => {
  const normalised
    = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  return normalised === href;
};
