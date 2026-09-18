import type { ElementType, ReactNode } from "react";
import { Children, isValidElement } from "react";

import { Card } from "@/shared/ui/card";
import { Item, ItemContent, ItemDescription, ItemMedia } from "@/shared/ui/item";

type ListRowProps = {
  icon?: ReactNode;
  title: ReactNode;
  text: ReactNode;
  titleAs?: ElementType;
};

export const ListRow = ({ icon, title, text, titleAs: Title = "h3" }: ListRowProps) => (
  <Item className="gap-3.5 rounded-none border-0 px-0 py-4">
    {icon ? (
      <ItemMedia
        aria-hidden="true"
        className="size-9.5 rounded-xs bg-primary/10 text-primary"
      >
        {icon}
      </ItemMedia>
    ) : null}
    <ItemContent className="gap-0.75">
      <Title className="text-list-title font-580 tracking-list-row leading-snug">
        {title}
      </Title>
      <ItemDescription className="line-clamp-none text-caption font-500 text-ink-a50 text-pretty">
        {text}
      </ItemDescription>
    </ItemContent>
  </Item>
);

type ListCardProps = {
  children: ReactNode;
};

// <ul>/<li> — не ItemGroup (тот даёт role="list" на <div>, а не настоящий
// список): пункт 2 ревью требовал именно списковую разметку.
export const ListCard = ({ children }: ListCardProps) => {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <Card className="gap-0 rounded-xl px-4 py-0 shadow-card ring-0">
      <ul className="flex flex-col">
        {rows.map((row, index) => (
          <li
            key={row.key ?? index}
            className={index < rows.length - 1 ? "border-b border-ink-a07" : undefined}
          >
            {row}
          </li>
        ))}
      </ul>
    </Card>
  );
};
