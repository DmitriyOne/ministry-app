"use client";

import { cn } from "@/shared/lib/cn";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronLeftIcon } from "@/shared/ui/icons";

// "use client" is only for useTranslations (default backLabel) — before
// the dictionary the component was server-only (see ADR 0013); the press
// handler still lives inside Button (react-aria, onPress, not onClick).
type ScreenHeaderProps = {
  eyebrow: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
};

export const ScreenHeader = ({
  eyebrow,
  onBack,
  backLabel,
  className,
}: ScreenHeaderProps) => {
  const t = useTranslations("common");
  const resolvedBackLabel = backLabel ?? t("back");

  return (
    <header className={cn("flex items-center gap-3", className)}>
      <Button
        type="button"
        variant="plain"
        onPress={onBack}
        aria-label={resolvedBackLabel}
        className="size-9.5 shrink-0 rounded-full p-0 [--press-scale:0.94]"
      >
        <ChevronLeftIcon size={18} />
      </Button>
      <Eyebrow as="span">{eyebrow}</Eyebrow>
    </header>
  );
};
