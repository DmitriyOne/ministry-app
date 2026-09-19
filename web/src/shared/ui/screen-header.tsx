"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronLeftIcon } from "@/shared/ui/icons";

// "use client" только из-за useTranslations (для default backLabel) — до
// словаря компонент был серверным (см. ADR 0013), обработчик нажатия и
// сейчас живёт внутри Button (react-aria, onPress, не onClick).
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
