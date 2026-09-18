import type { ReactNode } from "react";
import { cn } from "cn";

import { ScreenHeader } from "@/shared/ui/screen-header";

// Контентный экран (О приложении): фиксированная шапка + прокручиваемая
// колонка карточек.
type ScrollStateProps = {
  eyebrow: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  className?: string;
};

// Прокручиваемая область — единственный <main> экрана (ScreenHeader —
// <header>, не часть main). CenteredState/TopAndBottomState сами уже
// <main> — на одном экране используется ровно один из трёх каркасов.
export const ScrollState = ({
  eyebrow,
  onBack,
  backLabel,
  children,
  className,
}: ScrollStateProps) => (
  <div className={cn("flex min-h-dvh flex-col bg-background", className)}>
    <ScreenHeader eyebrow={eyebrow} onBack={onBack} backLabel={backLabel} className="px-5 pt-6" />
    <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1.5 pb-10">
      {children}
    </main>
  </div>
);
