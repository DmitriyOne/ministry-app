import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

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
  key: "warmGray" | "deepGreen" | "mutedGreen" | "darkGreen" | "terracotta" | "mint" | "white";
  hex: string;
  swatchClassName: string;
  borderClassName?: string;
};

const PALETTE: PaletteSwatch[] = [
  { key: "warmGray", hex: "#F6F5F3", swatchClassName: "bg-background", borderClassName: "border border-ink-a09" },
  { key: "deepGreen", hex: "#1E4A40", swatchClassName: "bg-hero" },
  { key: "mutedGreen", hex: "#2E6F5E", swatchClassName: "bg-primary" },
  { key: "darkGreen", hex: "#22302C", swatchClassName: "bg-ink" },
  { key: "terracotta", hex: "#9A5238", swatchClassName: "bg-negative" },
  { key: "mint", hex: "#8FD4B4", swatchClassName: "bg-positive-hero" },
  { key: "white", hex: "#FFFFFF", swatchClassName: "bg-card", borderClassName: "border border-ink-a09" },
];

type TypeRow = {
  key: "display" | "totals" | "screenTitle" | "dayTitle" | "listRow" | "caption" | "eyebrow";
  className: string;
};

const TYPE_SCALE: TypeRow[] = [
  { key: "display", className: "text-display font-620 tracking-display tabular-nums" },
  { key: "totals", className: "text-totals font-620 tracking-totals tabular-nums" },
  { key: "screenTitle", className: "text-screen-title font-640 tracking-screen-title" },
  { key: "dayTitle", className: "text-day-title font-640 tracking-day-title" },
  { key: "listRow", className: "text-list-row font-580 tracking-list-row" },
  { key: "caption", className: "text-caption font-540 text-ink-a50" },
  {
    key: "eyebrow",
    className: "text-eyebrow font-600 tracking-eyebrow uppercase text-ink-a40",
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
  key: "calendar" | "month" | "year" | "profile" | "check" | "rabbit" | "turtle" | "lockClosed" | "lockOpen" | "appMark" | "eye";
  render: () => ReactNode;
};

const ICONS: IconEntry[] = [
  { key: "calendar", render: () => <CalendarIcon size={28} /> },
  { key: "month", render: () => <MonthIcon size={28} /> },
  { key: "year", render: () => <YearIcon size={28} /> },
  { key: "profile", render: () => <ProfileIcon size={28} /> },
  { key: "check", render: () => <CheckIcon size={22} className="text-primary" /> },
  { key: "rabbit", render: () => <RabbitIcon size={24} className="text-hero" /> },
  { key: "turtle", render: () => <TurtleIcon size={26} className="text-negative" /> },
  { key: "lockClosed", render: () => <LockClosedIcon size={22} className="text-ink-a55" /> },
  { key: "lockOpen", render: () => <LockOpenIcon size={22} className="text-ink-a55" /> },
  {
    key: "appMark",
    render: () => (
      <div className="flex h-10 w-10 items-center justify-center rounded-xs bg-hero">
        <AppMarkIcon size={24} className="text-white" />
      </div>
    ),
  },
  { key: "eye", render: () => <EyeIcon size={26} className="text-ink-a45" /> },
];

// Демонстрация ICU-плюрализации next-intl (ADR 0014) — понадобится на
// экранах «День» и «Месяц»: часы, минуты, изучения, «осталось N дней».
const PLURAL_SAMPLES = [4, 5, 21] as const;
const PLURAL_ROWS = [
  { labelKey: "hoursLabel", valueKey: "hours" },
  { labelKey: "minutesLabel", valueKey: "minutes" },
  { labelKey: "studiesLabel", valueKey: "studies" },
  { labelKey: "daysLeftLabel", valueKey: "daysLeft" },
] as const;

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

export const StyleguidePage = async () => {
  const t = await getTranslations("showcase");

  return (
    <main className="flex flex-1 justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-[1080px] flex-col gap-7">
        <header className="flex flex-col gap-1.5">
          <p className="text-eyebrow font-600 tracking-eyebrow uppercase text-ink-a40">
            {t("styleguide.eyebrow")}
          </p>
          <h1 className="text-screen-title font-640 tracking-screen-title">{t("styleguide.title")}</h1>
        </header>

        <SectionCard eyebrow={t("styleguide.sections.palette")}>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {PALETTE.map((swatch) => (
              <div key={swatch.hex} className="flex flex-col gap-2.5">
                <div
                  className={`h-24 rounded-lg ${swatch.swatchClassName} ${swatch.borderClassName ?? ""}`}
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-[15px] font-580">
                    {t(`styleguide.palette.${swatch.key}.name`)} · {swatch.hex}
                  </p>
                  <p className="text-caption font-540 text-ink-a50">
                    {t(`styleguide.palette.${swatch.key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-caption font-540 leading-relaxed text-ink-a50">
            {t.rich("styleguide.paletteNote", {
              code: (chunks) => <code>{chunks}</code>,
            })}
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <div className="flex h-[34px] items-center rounded-xs bg-background px-3.5 text-caption font-540 text-ink-a60">
              {t("styleguide.chips.shadow")}
            </div>
            <div className="flex h-[34px] items-center rounded-xs bg-background px-3.5 text-caption font-540 text-ink-a60">
              {t("styleguide.chips.radius")}
            </div>
            <button
              type="button"
              className="flex h-[34px] items-center rounded-xs bg-background px-3.5 text-caption font-540 text-ink-a60 transition-transform active:scale-[0.95]"
            >
              {t("styleguide.chips.press")}
            </button>
          </div>
        </SectionCard>

        <SectionCard eyebrow={t("styleguide.sections.typography")}>
          <div className="flex flex-col gap-4">
            {TYPE_SCALE.map((row, i) => (
              <div key={row.key}>
                <div className="flex items-baseline gap-5">
                  <span className="w-[170px] shrink-0 text-[12px] font-540 text-ink-a45">
                    {t(`styleguide.typeScale.${row.key}.label`)}
                  </span>
                  <span className={row.className}>{t(`styleguide.typeScale.${row.key}.sample`)}</span>
                </div>
                {i < TYPE_SCALE.length - 1 && <div className="mt-4 h-px bg-ink-a07" />}
              </div>
            ))}
          </div>
          <p className="text-caption font-540 leading-relaxed text-ink-a50 text-pretty">
            {t.rich("styleguide.typeScaleNote", {
              code: (chunks) => <code>{chunks}</code>,
            })}
          </p>
        </SectionCard>

        <SectionCard eyebrow={t("styleguide.sections.radius")}>
          <div className="grid grid-cols-4 gap-3.5 sm:grid-cols-8">
            {RADIUS_SCALE.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div
                  className={`h-14 w-14 bg-background ${r.className} border border-ink-a09`}
                />
                <span className="text-caption font-540 text-ink-a50">{r.px}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-card shadow-card" />
            <p className="text-caption font-540 text-ink-a50">{t("styleguide.shadowCaption")}</p>
          </div>
        </SectionCard>

        <SectionCard eyebrow={t("styleguide.sections.icons")}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ICONS.map((icon) => (
              <div
                key={icon.key}
                className="flex flex-col items-center gap-3 rounded-lg bg-background p-4.5"
              >
                <div className="flex h-11 items-center">{icon.render()}</div>
                <p className="text-center text-caption font-560">{t(`styleguide.icons.${icon.key}`)}</p>
              </div>
            ))}
          </div>
          <p className="text-caption font-540 leading-relaxed text-ink-a50 text-pretty">
            {t.rich("styleguide.iconsNote", {
              code: (chunks) => <code>{chunks}</code>,
            })}
          </p>
        </SectionCard>

        <SectionCard eyebrow={t("styleguide.sections.buttons")}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">{t("styleguide.buttons.markToday")}</Button>
            <Button variant="secondary">{t("styleguide.buttons.edit")}</Button>
            <Button variant="outline">{t("styleguide.buttons.cancel")}</Button>
            <Button variant="ghost">{t("styleguide.buttons.skip")}</Button>
            <Button variant="destructive">{t("styleguide.buttons.delete")}</Button>
          </div>
        </SectionCard>

        <SectionCard eyebrow={t("plurals.sectionTitle")}>
          <p className="text-caption font-540 leading-relaxed text-ink-a50 text-pretty">
            {t("plurals.sectionDescription")}
          </p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {PLURAL_ROWS.map(({ labelKey, valueKey }) => (
              <div key={valueKey} className="flex flex-col gap-2 rounded-lg bg-background p-4.5">
                <span className="text-caption font-540 text-ink-a45">
                  {t(`plurals.${labelKey}`)}
                </span>
                <div className="flex flex-col gap-0.5">
                  {PLURAL_SAMPLES.map((count) => (
                    <span key={count} className="text-list-row font-580 tracking-list-row">
                      {t(`plurals.${valueKey}`, { count })}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  );
};
