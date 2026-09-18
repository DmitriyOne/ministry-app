import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import {
  AppMarkIcon,
  CalendarIcon,
  CheckIcon,
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon,
  MonthIcon,
  ProfileIcon,
  RabbitIcon,
  TurtleIcon,
  YearIcon,
} from "@/shared/ui/icons";

// Служебная страница для сверки токенов с прототипом, не экран приложения — см. ADR 0011.

type PaletteSwatch = {
  name: string;
  hex: string;
  description: string;
  swatchClassName: string;
  borderClassName?: string;
};

const PALETTE: PaletteSwatch[] = [
  {
    name: "Тёплый серый",
    hex: "#F6F5F3",
    description: "Фон всех экранов, вдавленные поля",
    swatchClassName: "bg-background",
    borderClassName: "border border-ink-a09",
  },
  {
    name: "Глубокий зелёный",
    hex: "#1E4A40",
    description: "Карточки-герои, вход, экран перевыполнения",
    swatchClassName: "bg-hero",
  },
  {
    name: "Приглушённый зелёный",
    hex: "#2E6F5E",
    description: "Действия, «+», прогресс, состояние «в графике»",
    swatchClassName: "bg-primary",
  },
  {
    name: "Тёмный зелёный",
    hex: "#22302C",
    description: "Весь текст; прозрачности .5 / .4 — подписи",
    swatchClassName: "bg-ink",
  },
  {
    name: "Терракота",
    hex: "#9A5238",
    description: "Отставание, ошибка 500, отрицательная дельта",
    swatchClassName: "bg-negative",
  },
  {
    name: "Светлая мята",
    hex: "#8FD4B4",
    description: "Только на тёмно-зелёном: часы сверх плана",
    swatchClassName: "bg-positive-hero",
  },
  {
    name: "Белый",
    hex: "#FFFFFF",
    description: "Карточки",
    swatchClassName: "bg-card",
    borderClassName: "border border-ink-a09",
  },
];

type TypeRow = {
  label: string;
  className: string;
  sample: string;
};

const TYPE_SCALE: TypeRow[] = [
  {
    label: "56 / 620 · tabular",
    className: "text-display font-620 tracking-display tabular-nums",
    sample: "2:15",
  },
  {
    label: "44 / 620 · итоги",
    className: "text-totals font-620 tracking-totals tabular-nums",
    sample: "279:15",
  },
  {
    label: "34 / 640 · заголовок",
    className: "text-screen-title font-640 tracking-screen-title",
    sample: "2 июня",
  },
  {
    label: "30 / 640 · заголовок дня",
    className: "text-day-title font-640 tracking-day-title",
    sample: "2 июня",
  },
  {
    label: "17 / 580 · строка списка",
    className: "text-list-row font-580 tracking-list-row",
    sample: "Подсобный пионер",
  },
  {
    label: "13 / 540 · пояснение",
    className: "text-caption font-540 text-ink-a50",
    sample: "До конца месяца 28 дней · осталось 27 ч 45 мин",
  },
  {
    label: "11 / 600 · 0.12em CAPS",
    className:
      "text-eyebrow font-600 tracking-eyebrow uppercase text-ink-a40",
    sample: "Служебный год 2025–2026",
  },
];

const RADIUS_SCALE = [
  { name: "xs", px: 12, className: "rounded-xs" },
  { name: "sm", px: 13, className: "rounded-sm" },
  { name: "md", px: 18, className: "rounded-md" },
  { name: "lg", px: 20, className: "rounded-lg" },
  { name: "xl", px: 22, className: "rounded-xl" },
  { name: "2xl", px: 26, className: "rounded-2xl" },
  { name: "3xl", px: 28, className: "rounded-3xl" },
  { name: "4xl", px: 32, className: "rounded-4xl" },
];

type IconEntry = {
  label: string;
  render: () => ReactNode;
};

const ICONS: IconEntry[] = [
  { label: "Календарь", render: () => <CalendarIcon size={28} /> },
  { label: "Месяц · список дней", render: () => <MonthIcon size={28} /> },
  { label: "Год · график", render: () => <YearIcon size={28} /> },
  { label: "Профиль · человек", render: () => <ProfileIcon size={28} /> },
  {
    label: "Галочка — в графике",
    render: () => <CheckIcon size={22} className="text-primary" />,
  },
  {
    label: "Заяц — опережение",
    render: () => <RabbitIcon size={24} className="text-hero" />,
  },
  {
    label: "Черепаха — отставание",
    render: () => <TurtleIcon size={26} className="text-negative" />,
  },
  {
    label: "Замок закрыт",
    render: () => <LockClosedIcon size={22} className="text-ink-a55" />,
  },
  {
    label: "Замок открыт",
    render: () => <LockOpenIcon size={22} className="text-ink-a55" />,
  },
  {
    label: "Знак для входа",
    render: () => (
      <div className="flex h-10 w-10 items-center justify-center rounded-xs bg-hero">
        <AppMarkIcon size={24} className="text-white" />
      </div>
    ),
  },
  {
    label: "Глаз — показать пароль",
    render: () => <EyeIcon size={26} className="text-ink-a45" />,
  },
];

type SectionCardProps = {
  eyebrow: string;
  children: ReactNode;
};

const SectionCard = ({ eyebrow, children }: SectionCardProps) => {
  return (
    <section className="flex flex-col gap-5 rounded-3xl bg-card p-7 shadow-card">
      <h2 className="text-eyebrow font-600 tracking-eyebrow uppercase text-ink-a40">
        {eyebrow}
      </h2>
      {children}
    </section>
  );
};

export const StyleguidePage = () => {
  return (
    <main className="flex flex-1 justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-[1080px] flex-col gap-7">
        <header className="flex flex-col gap-1.5">
          <p className="text-eyebrow font-600 tracking-eyebrow uppercase text-ink-a40">
            Учёт служения
          </p>
          <h1 className="text-screen-title font-640 tracking-screen-title">
            Цвета, шрифт, иконки
          </h1>
        </header>

        <SectionCard eyebrow="Палитра">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {PALETTE.map((swatch) => (
              <div key={swatch.hex} className="flex flex-col gap-2.5">
                <div
                  className={`h-24 rounded-lg ${swatch.swatchClassName} ${swatch.borderClassName ?? ""}`}
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-[15px] font-580">
                    {swatch.name} · {swatch.hex}
                  </p>
                  <p className="text-caption font-540 text-ink-a50">
                    {swatch.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-caption font-540 leading-relaxed text-ink-a50">
            Также в прототипе встречается #245549 — hover/pressed-состояние
            приглушённого зелёного (цвет ссылок при наведении), заведено как
            производный токен <code>--color-accent-hover</code>, а не
            самостоятельный цвет палитры. #B00020 в прототипе — служебный
            цвет инструмента предпросмотра (баннер ошибки редактора), к
            дизайн-системе приложения отношения не имеет и токеном не стал.
            Подробности — в ADR 0011.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <div className="flex h-[34px] items-center rounded-xs bg-background px-3.5 text-caption font-540 text-ink-a60">
              Тени: shadow-card
            </div>
            <div className="flex h-[34px] items-center rounded-xs bg-background px-3.5 text-caption font-540 text-ink-a60">
              Радиусы: 12/13/18/20/22/26/28/32
            </div>
            <button
              type="button"
              className="flex h-[34px] items-center rounded-xs bg-background px-3.5 text-caption font-540 text-ink-a60 transition-transform active:scale-[0.95]"
            >
              Нажатие: transform scale(0.93–0.98)
            </button>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Типографика · --font-sans (системный стек)">
          <div className="flex flex-col gap-4">
            {TYPE_SCALE.map((row, i) => (
              <div key={row.label}>
                <div className="flex items-baseline gap-5">
                  <span className="w-[170px] shrink-0 text-[12px] font-540 text-ink-a45">
                    {row.label}
                  </span>
                  <span className={row.className}>{row.sample}</span>
                </div>
                {i < TYPE_SCALE.length - 1 && (
                  <div className="mt-4 h-px bg-ink-a07" />
                )}
              </div>
            ))}
          </div>
          <p className="text-caption font-540 leading-relaxed text-ink-a50 text-pretty">
            Все цифры — <code>tabular-nums</code>, чтобы значения не «прыгали»
            при пересчёте. Часы в интерфейсе — формат «2:15»; в текстах о
            цели и отклонении — словами: «27 ч 45 мин», «(−9 ч)».
          </p>
        </SectionCard>

        <SectionCard eyebrow="Радиусы и тень">
          <div className="grid grid-cols-4 gap-3.5 sm:grid-cols-8">
            {RADIUS_SCALE.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div
                  className={`h-14 w-14 bg-background ${r.className} border border-ink-a09`}
                />
                <span className="text-caption font-540 text-ink-a50">
                  {r.px}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-card shadow-card" />
            <p className="text-caption font-540 text-ink-a50">
              shadow-card — 0 1px 2px rgba(34,48,44,0.05)
            </p>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Иконки · собственные SVG, в манере SF Symbols">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ICONS.map((icon) => (
              <div
                key={icon.label}
                className="flex flex-col items-center gap-3 rounded-lg bg-background p-4.5"
              >
                <div className="flex h-11 items-center">{icon.render()}</div>
                <p className="text-center text-caption font-560">
                  {icon.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-caption font-540 leading-relaxed text-ink-a50 text-pretty">
            Иконки вкладок — SVG 18×18 при viewBox 20×20: штрих 1.5 (ушки
            календаря 1.6), скругление контейнеров rx 4.2, столбиков графика
            rx 1.45, точки r 0.9–0.95, все окончания линий круглые. Цвет
            наследуется от состояния через <code>currentColor</code>.
            Отдельного шрифта иконок и эмодзи в проекте нет.
          </p>
        </SectionCard>

        <SectionCard eyebrow="Кнопки shadcn/ui на токенах проекта">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">Отметить сегодня</Button>
            <Button variant="secondary">Изменить</Button>
            <Button variant="outline">Отмена</Button>
            <Button variant="ghost">Пропустить</Button>
            <Button variant="destructive">Удалить запись</Button>
          </div>
        </SectionCard>
      </div>
    </main>
  );
};
