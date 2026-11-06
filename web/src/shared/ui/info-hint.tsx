"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DialogTrigger } from "react-aria-components";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { InfoCircleIcon } from "@/shared/ui/icons";
import { Popover } from "@/shared/ui/popover";

type InfoHintProps = {
  // What the figures beside this sign mean, in the words of the screen
  // that owns them. The text is a prop rather than a key so this stays
  // what shared/ui components are — markup with no domain in it (ADR
  // 0013) — and so a server component can hand it over already
  // translated.
  text: string;
  // The accessible name of the sign, when "What this means" is not
  // enough on its own: several signs sit on one screen, and a reader
  // moving between them hears only the names.
  label?: string;
  // What the sign is standing on, not what it should look like: the
  // component works out both the sign's colour and the bubble's from
  // it. One answer instead of two, because the two were never
  // independent — a dark bubble on a dark card is invisible, and so is
  // an ink sign.
  surface?: "light" | "dark";
  className?: string;
};

// The small "i" beside a block's heading, and the bubble it opens.
//
// A bubble anchored to the sign rather than a bottom panel, by the
// owner's decision: the answer belongs beside the figure it explains,
// and a panel covering half the screen to say two sentences asks the
// person to remember the number they were looking at. The panel stays
// what it is for — choices and confirmations.
//
// Tap to open, not hover: there is no hover on a phone. Everything else
// — placing, flipping, the 16px the bubble keeps from every edge of the
// screen, Escape, a tap outside, focus — comes from react-aria through
// shared/ui/popover.
const SIGN_TONE = {
  // The ghost variant repaints the label while the popup is open
  // (aria-expanded:text-foreground), which turned the sign ink-dark on a
  // --hero card the moment it was pressed — it vanished into the card.
  // Both states are spelled out here so neither surface can lose it.
  light: "text-ink-a55 aria-expanded:text-ink-a55",
  dark: "text-hero-foreground/65 aria-expanded:text-hero-foreground/65",
} as const;

export const InfoHint = ({
  text,
  label,
  surface = "light",
  className,
}: InfoHintProps) => {
  const t = useTranslations("a11y");
  const name = label ?? t("whatThisMeans");
  // The area the bubble may occupy. Without it react-aria measures
  // against the viewport, which knows nothing about the navigation bar:
  // the bar is fixed, so a bubble opened low on the screen was placed
  // "inside the viewport" and came out underneath the glass, with its
  // last line unreadable. Measured in the browser at a short viewport.
  //
  // An empty fixed div rather than a number here: the bar's footprint is
  // --bottom-nav-space, the same measurement the group's layout pads by,
  // and a second copy of it would drift the first time the bar changes
  // height.
  // Held in state, not a ref: the bubble needs the element itself as a
  // prop, and a ref read during render is both a lint error and a lie —
  // it is still null on the render that would use it.
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Closing on a tap elsewhere, which react-aria stops doing the moment
  // the popover is non-modal: it ties dismissal to modality
  // (`isDismissable: !isNonModal` in usePopover), so the choice it
  // offers is a bubble that freezes the page or one that will not go
  // away. Neither is right for a hint, so this is the half we put back.
  //
  // Escape, a scroll and a second press on the sign are still
  // react-aria's. Capture phase, so the bubble goes before whatever was
  // tapped does its own work — and `pointerdown` rather than `click`,
  // because that is the moment a finger lands.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;

      // The sign toggles itself, and a tap inside the bubble is not a
      // tap outside it.
      if (target?.closest("[data-slot=popover-content], [data-info-hint]")) return;

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);

    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isOpen]);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <div
        ref={setBoundary}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 bottom-[var(--bottom-nav-space)] -z-10"
      />
      <Button
        // "ghost", not "plain": plain is a role from the catalogue — a
        // white card with a shadow — and it drew a white tile with an
        // invisible white glyph on the hero cards. A sign is not a
        // button-shaped thing; it is a glyph you can press.
        variant="ghost"
        size="icon-sm"
        aria-label={name}
        // Marks the sign for the handler above, so a press on it is
        // left to react-aria's own toggle instead of being treated as a
        // tap outside.
        data-info-hint="true"
        className={cn(
          // The glyph is 16px, the target around it is not: a tap lands
          // on the button, and the button is sized for a finger rather
          // than for the glyph (ADR 0012).
          "size-9 -my-1 shrink-0 bg-transparent shadow-none",
          SIGN_TONE[surface],
          // The base classes hold the press back on anything with a
          // popup (active:not-aria-[haspopup]:translate-y-px), and
          // hover belongs to a mouse this app never meets. So the sign
          // answers the finger by fading, and says it is open by
          // dropping the fade.
          "hover:bg-transparent active:opacity-55 aria-expanded:bg-transparent aria-expanded:opacity-100",
          className,
        )}
      >
        <InfoCircleIcon size={16} />
      </Button>

      {/* A dark bubble on a dark card merges into it, so the surface
          decides this too. */}
      <Popover
        label={name}
        tone={surface === "dark" ? "light" : "dark"}
        boundaryElement={boundary ?? undefined}
      >
        {text}
      </Popover>
    </DialogTrigger>
  );
};
