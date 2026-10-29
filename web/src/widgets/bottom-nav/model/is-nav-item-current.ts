// Pulled out of the component so the one comparison the active state
// depends on is provable (is-nav-item-current.test.ts) instead of being
// something to squint at in a browser. Same two rules as
// widgets/screen-footer/ui/FooterLink.tsx:
//
// - usePathname can report a trailing-slash variant depending on routing
//   config, so that must not be what decides the match;
// - the comparison is exact, not a prefix — /month must not light up for
//   a future /month-summary.
//
// `hasFamily` is the one exception, and it is opt-in per item rather
// than a loosening of the rule: /day's own screens carry their date
// (/day/2026-06-02, ADR 0063), so the exact comparison would leave the
// menu with nothing lit on the screen a person spends most time on. The
// separator is required, so the items that do not opt in behave exactly
// as before, and even the one that does is not fooled by /day-summary.
export const isNavItemCurrent = (
  pathname: string,
  href: string,
  hasFamily = false,
): boolean => {
  const normalised
    = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (normalised === href) return true;

  return hasFamily && normalised.startsWith(`${href}/`);
};
