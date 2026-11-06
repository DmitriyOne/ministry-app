"use client";

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
export const InfoHint = ({ text, label, className }: InfoHintProps) => {
  const t = useTranslations("a11y");
  const name = label ?? t("whatThisMeans");

  return (
    <DialogTrigger>
      <Button
        variant="plain"
        size="icon-sm"
        aria-label={name}
        // The sign is 15px, the target around it is not: a tap lands on
        // the button, and the button is sized for a finger rather than
        // for the glyph (ADR 0012).
        className={cn("size-9 -my-1 shrink-0 text-ink-a55", className)}
      >
        <InfoCircleIcon size={15} />
      </Button>

      <Popover label={name}>{text}</Popover>
    </DialogTrigger>
  );
};
