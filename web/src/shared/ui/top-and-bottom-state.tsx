import type { ReactNode } from "react";
import { cn } from "cn";

// Экран ввода (Вход): шапка прижата к верху, форма и действия — к низу, под
// большой палец. Фон всегда --hero.
type TopAndBottomStateProps = {
  top: ReactNode;
  bottom: ReactNode;
  className?: string;
};

export const TopAndBottomState = ({ top, bottom, className }: TopAndBottomStateProps) => (
  <main
    className={cn(
      "flex min-h-dvh flex-col justify-between bg-hero px-6 pt-24 pb-8 text-hero-foreground",
      className,
    )}
  >
    <div className="flex flex-col gap-2.5">{top}</div>
    <div className="flex flex-col gap-2">{bottom}</div>
  </main>
);
