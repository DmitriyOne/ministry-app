"use client";

import { cn } from "@/shared/lib/cn";
import { useTranslations } from "next-intl";

import { Button, LinkButton } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronLeftIcon } from "@/shared/ui/icons";

// "use client" is only for useTranslations (default backLabel) — before
// the dictionary the component was server-only (see ADR 0013); the press
// handler still lives inside Button (react-aria, onPress, not onClick).
//
// Two ways to go back, and which one a screen can use is not a matter of
// taste. `onBack` is a function, so it can only be passed from code that
// is already a Client Component (React does not serialise functions across
// the RSC boundary) — that is features/screen-back, which decides between
// history and a fallback. `backHref` is a string, so a Server Component
// can pass it, and it is the honest choice for a screen that can be opened
// directly, where there is no history worth returning to. Giving both is a
// type error rather than a silent precedence rule.
type ScreenHeaderBack
  = | { onBack: () => void; backHref?: never }
    | { backHref: string; onBack?: never }
    | { onBack?: never; backHref?: never };

type ScreenHeaderProps = ScreenHeaderBack & {
  eyebrow: string;
  backLabel?: string;
  // Which surface the header sits on. "ink" is the warm background of the
  // document screens; "hero" is the deep green of sign-in and password
  // reset, where a white button and ink eyebrow would both be wrong.
  tone?: "ink" | "hero";
  className?: string;
};

export const ScreenHeader = ({
  eyebrow,
  onBack,
  backHref,
  backLabel,
  tone = "ink",
  className,
}: ScreenHeaderProps) => {
  const t = useTranslations("common");
  const resolvedBackLabel = backLabel ?? t("back");

  const backClassName = "size-9.5 shrink-0 rounded-full p-0 [--press-scale:0.94]";
  const backVariant = tone === "hero" ? "heroGhost" : "plain";

  return (
    <header className={cn("flex items-center gap-3 px-5 pt-6 pb-3", className)}>
      {backHref
        ? (
            <LinkButton
              href={backHref}
              variant={backVariant}
              aria-label={resolvedBackLabel}
              className={backClassName}
            >
              <ChevronLeftIcon size={18} />
            </LinkButton>
          )
        : (
            <Button
              type="button"
              variant={backVariant}
              onPress={onBack}
              aria-label={resolvedBackLabel}
              className={backClassName}
            >
              <ChevronLeftIcon size={18} />
            </Button>
          )}
      <Eyebrow as="span" className={tone === "hero" ? "text-hero-foreground/70" : undefined}>
        {eyebrow}
      </Eyebrow>
    </header>
  );
};
