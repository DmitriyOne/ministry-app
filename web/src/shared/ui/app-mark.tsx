import { cn } from "cn";

import { AppMarkIcon } from "@/shared/ui/icons";

// Радиус растёт вместе с размером (каталог компонентов): 14 / 16 / 18 / 24.
const SIZE = {
  44: { box: "size-11", radius: "rounded-mark-sm", icon: 24 },
  52: { box: "size-13", radius: "rounded-mark-md", icon: 30 },
  56: { box: "size-14", radius: "rounded-md", icon: 32 },
  88: { box: "size-22", radius: "rounded-mark-lg", icon: 40 },
} as const;

const TONE = {
  // Светлый фон — плашка глубокого зелёного.
  solid: "bg-hero",
  // Зелёный фон — белая плашка с прозрачностью 0.12.
  translucent: "bg-white/12",
} as const;

type AppMarkProps = {
  size?: keyof typeof SIZE;
  tone?: keyof typeof TONE;
  elevated?: boolean;
  // Знак почти всегда стоит рядом с видимым текстом (заголовком экрана) —
  // по умолчанию декоративный. Передать label, когда AppMark — единственный
  // логотип без соседнего текста (например, будущий favicon-подобный кейс).
  label?: string;
  className?: string;
};

export const AppMark = ({
  size = 44,
  tone = "solid",
  elevated = false,
  label,
  className,
}: AppMarkProps) => {
  const { box, radius, icon } = SIZE[size];

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "flex items-center justify-center",
        box,
        radius,
        TONE[tone],
        elevated && "shadow-mark-elevated",
        className,
      )}
    >
      <AppMarkIcon size={icon} className="text-white" />
    </div>
  );
};
