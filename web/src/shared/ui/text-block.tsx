import type { ElementType, ReactNode } from "react";
import { cn } from "cn";

import { BodyText } from "@/shared/ui/body-text";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Title } from "@/shared/ui/title";

// Заголовок + абзац идут парой почти на каждом экране-состоянии — один
// компонент вместо копирования одной и той же колонки с gap.
type TextBlockProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  titleSize?: "default" | "compact";
  // Уровень заголовка в документе решает вызывающий экран, а не сам блок:
  // TextBlock — это главный заголовок state-экрана (h1) на реальном
  // экране, но в чужом контексте (например, в карточке-примере) должен
  // стать h2/h3 и т.д., чтобы не плодить второй h1 на странице.
  titleAs?: ElementType;
  tone?: "ink" | "hero";
  align?: "start" | "center";
  spacing?: "tight" | "loose";
  className?: string;
};

export const TextBlock = ({
  eyebrow,
  title,
  text,
  titleSize = "default",
  titleAs,
  tone = "ink",
  align = "start",
  spacing = "tight",
  className,
}: TextBlockProps) => (
  <div
    className={cn(
      "flex flex-col",
      spacing === "tight" ? "gap-2" : "gap-4",
      align === "center" && "items-center text-center",
      className,
    )}
  >
    {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
    <Title size={titleSize} tone={tone} as={titleAs}>
      {title}
    </Title>
    {text ? <BodyText tone={tone}>{text}</BodyText> : null}
  </div>
);
