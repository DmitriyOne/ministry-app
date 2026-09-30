import { createCn } from "cn/config";

// The `cn` package (a drop-in clsx + tailwind-merge replacement, compiled
// into class-conflict tables) doesn't see our `@theme` in globals.css — it
// classifies each class against a static snapshot of the standard
// Tailwind palette. A suffix after "text-"/"font-"/"rounded-"/"shadow-"
// that isn't in that snapshot (e.g. "list-row" from text-list-row)
// doesn't match any known size/weight/radius pattern and falls back to
// a group with a looser validator (for historical reasons, the colour
// group) — so it conflicts with real colour classes (bg-*/text-{color}),
// and on merge only the last class in order survives. For example
// `cn("text-hero-foreground", "text-list-row")` without this config
// returns only `"text-list-row"` — the colour silently disappears.
// Details and how this was discovered — ADR 0011 (the class-merging
// section).
//
// Rule going forward: any new named token in `@theme inline`
// (globals.css) — a new text size, font weight, radius, shadow —
// gets added to the matching list below, otherwise it risks silently
// conflicting with a class from another, visually unrelated group.

// `--text-*` in @theme inline, except `--text-*--line-height` (not a
// separate Tailwind utility, but part of the paired `text-*` value).
const FONT_SIZE_NAMES = [
  "display",
  "totals",
  "screen-title",
  "day-title",
  "list-row",
  "caption",
  "eyebrow",
  "title",
  "body",
  "status",
] as const;

// `--font-weight-*` in @theme inline (the component catalogue's fractional
// weights, see ADR 0011/0012) — the `font-500`…`font-640` class suffix.
const FONT_WEIGHT_NAMES = ["500", "520", "540", "560", "580", "600", "620", "640"] as const;

// `--radius-mark-sm/md/lg`, `--radius-button` in @theme inline (ADR 0012)
// — the `rounded-mark-sm` etc. class suffix. The numeric `--radius-12…32`
// tokens aren't included here: they aren't wired into `@theme inline`
// directly and don't produce `rounded-*` utilities.
const RADIUS_NAMES = ["mark-sm", "mark-md", "mark-lg", "button"] as const;

// `--shadow-card`, `--shadow-mark-elevated` in @theme inline — the
// `shadow-card`/`shadow-mark-elevated` class suffix.
const SHADOW_NAMES = ["card", "mark-elevated"] as const;

export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZE_NAMES] }],
      "font-weight": [{ font: [...FONT_WEIGHT_NAMES] }],
      rounded: [{ rounded: [...RADIUS_NAMES] }],
      shadow: [{ shadow: [...SHADOW_NAMES] }],
    },
  },
});
