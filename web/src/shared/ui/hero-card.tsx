import type { ElementType, ReactNode } from "react";

import { AppMark } from "@/shared/ui/app-mark";
import { Card } from "@/shared/ui/card";

type HeroCardProps = {
  title: ReactNode;
  text: ReactNode;
  titleAs?: ElementType;
};

export const HeroCard = ({ title, text, titleAs: Title = "h2" }: HeroCardProps) => (
  <Card className="gap-3.5 rounded-2xl bg-hero px-5.5 py-6 text-hero-foreground ring-0">
    <AppMark size={52} tone="translucent" />
    <div className="flex flex-col gap-1.5">
      <Title className="text-hero-title font-640 tracking-day-title">{title}</Title>
      <p className="text-body font-500 text-hero-foreground/60 text-pretty">{text}</p>
    </div>
  </Card>
);
