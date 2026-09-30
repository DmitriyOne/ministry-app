import type { ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

import { BodyText } from "@/shared/ui/body-text";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Title } from "@/shared/ui/title";

// A title + paragraph pair shows up on almost every state screen — one
// component instead of copying the same gapped column everywhere.
type TextBlockProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  titleSize?: "default" | "compact";
  // The calling screen decides the heading level in the document, not
  // the block itself: TextBlock is the main heading (h1) of a state
  // screen on a real screen, but in someone else's context (e.g. a
  // showcase card) it should become h2/h3 etc. to avoid a second h1
  // on the page.
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
