"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import type { AppRoute } from "@/shared/config";
import { TextLink } from "@/shared/ui/text-link";

type FooterLinkProps = {
  href: AppRoute;
  children: ReactNode;
};

// The one client piece of the footer. ScreenFooter (ui/ScreenFooter.tsx)
// stays a Server Component — it only needs getTranslations — but knowing
// which link points at the page currently open needs `usePathname`
// (next/navigation), which only works in a Client Component. Splitting
// that one leaf out, rather than making the whole footer client, keeps
// the boundary as small as the job needs.
//
// TextLink (shared/ui) stays routeless and dumb — it takes a plain
// `isCurrent` boolean and has no idea what a "route" is; this component
// is where that boolean gets decided, which is also why it isn't in
// shared/ui itself (comparing against `routes`/pathname is exactly the
// kind of route knowledge shared/ui must not carry).
export const FooterLink = ({ href, children }: FooterLinkProps) => {
  // `?? ""` guards against the `string | null` signature some toolchain
  // configurations attribute to usePathname (e.g. outside the app
  // router segment tree) — in this app it's always a real app-router
  // string, but the fallback keeps the comparison below total either
  // way instead of risking a thrown TypeError.
  const pathname = usePathname() ?? "";
  // usePathname can report a trailing-slash variant depending on
  // routing config — normalise before comparing so that isn't what
  // decides the match. Comparison is exact, not a prefix: `/about` must
  // not light up for some future `/about-something`.
  const normalisedPathname = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const isCurrent = normalisedPathname === href;

  return (
    <TextLink href={href} isCurrent={isCurrent} aria-current={isCurrent ? "page" : undefined}>
      {children}
    </TextLink>
  );
};
