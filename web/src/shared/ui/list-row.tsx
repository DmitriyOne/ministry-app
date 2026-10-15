"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { Link as LinkPrimitive } from "react-aria-components";

import { cn } from "@/shared/lib/cn";
import { isInternalHref } from "@/shared/ui/button";

// A row inside a white list card. All text comes in as props, no domain
// logic — plain enough for shared/ui (used by the about screen's Screens
// and Features lists, ADR 0029/0030, and by the profile screen's links).
//
// `icon` and `text` are optional because the same row serves two shapes:
// the about screen's icon + title + description, and the profile's plain
// title + chevron. The alternative was a second row component, or
// @shadcn/item from the registry — a whole parallel vocabulary for list
// rows (ItemGroup/ItemMedia/ItemContent/ItemActions) next to the one this
// project already has, for three rows that need a title and a trailing
// glyph. Checked before writing, as the component rule requires.
//
// "use client" is for the optional `href`: a row that navigates does it
// through react-aria's Link with next/link's render prop, the same wiring
// as TextLink and LinkButton (ADR 0024), so the whole row is one tap
// target and the navigation stays client-side. A row without `href` has
// no client behaviour of its own.
type ListRowProps = {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  // Sits at the end of the row — a chevron for a link, a switch for a
  // setting. Decorative by default: whatever it is, the title is what
  // names the row.
  trailing?: ReactNode;
  href?: string;
  divided?: boolean;
};

// items-start only when an icon tile sits beside a two-line block, so the
// tile lines up with the first line rather than floating between them —
// which is how the about screen's rows have always looked. Everything
// else centres: a chevron or a switch at the end of a row belongs on the
// row's middle line, not at the top of it.
const rowAlignment = (hasIcon: boolean, hasText: boolean) =>
  hasIcon && hasText ? "items-start" : "items-center";

export const ListRow = ({
  icon,
  title,
  text,
  trailing,
  href,
  divided = true,
}: ListRowProps) => {
  const body = (
    <>
      {icon
        ? (
            <div
              aria-hidden="true"
              className="flex size-9.5 shrink-0 items-center justify-center rounded-xs bg-background text-ink"
            >
              {icon}
            </div>
          )
        : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-list-row font-580 tracking-list-row text-ink">{title}</p>
        {text ? <p className="text-caption font-500 text-pretty text-ink-muted">{text}</p> : null}
      </div>
      {trailing}
    </>
  );

  const className = cn(
    "flex gap-3.5 py-4",
    rowAlignment(Boolean(icon), Boolean(text)),
    divided && "border-b border-ink-a07",
  );

  if (!href) return <div className={className}>{body}</div>;

  return (
    <LinkPrimitive
      href={href}
      className={cn(className, "outline-none focus-visible:ring-2 focus-visible:ring-ring")}
      render={
        isInternalHref(href)
          ? (linkProps) =>
              "href" in linkProps ? <NextLink {...linkProps} href={href} /> : <span {...linkProps} />
          : undefined
      }
    >
      {body}
    </LinkPrimitive>
  );
};
