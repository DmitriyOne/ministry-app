import { cn } from "cn";

import { Button } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronLeftIcon } from "@/shared/ui/icons";

// Остаётся серверным компонентом: обработчик нажатия живёт внутри Button
// (клиентский примитив), ScreenHeader сам хуков не использует. Button —
// react-aria-components: нажатие идёт через onPress, не onClick.
type ScreenHeaderProps = {
  eyebrow: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
};

export const ScreenHeader = ({
  eyebrow,
  onBack,
  backLabel = "Назад",
  className,
}: ScreenHeaderProps) => (
  <header className={cn("flex items-center gap-3", className)}>
    <Button
      type="button"
      variant="plain"
      onPress={onBack}
      aria-label={backLabel}
      className="size-9.5 shrink-0 rounded-full p-0 [--press-scale:0.94]"
    >
      <ChevronLeftIcon size={18} />
    </Button>
    <Eyebrow as="span">{eyebrow}</Eyebrow>
  </header>
);
