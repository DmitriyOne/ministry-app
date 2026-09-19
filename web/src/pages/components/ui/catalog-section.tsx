"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { SectionLabel } from "@/shared/ui/section-label";

type CatalogSectionProps = {
  index: number;
  title: string;
  children: ReactNode;
};

export const CatalogSection = ({ index, title, children }: CatalogSectionProps) => (
  <section className="flex flex-col gap-5">
    <SectionLabel className="text-ink-a40">
      {index} · {title}
    </SectionLabel>
    {children}
  </section>
);

type ComponentCardProps = {
  name: string;
  tag?: string;
  description: string;
  params: string;
  screens: string;
  children: ReactNode;
};

// name рендерится как h3 (под h2 секции) — живые примеры внутри children
// используют h4 через titleAs, чтобы не пропускать уровень.
export const ComponentCard = ({
  name,
  tag,
  description,
  params,
  screens,
  children,
}: ComponentCardProps) => {
  const t = useTranslations("showcase.components");

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card">
      <div className="flex flex-col gap-1.25">
        <div className="flex items-center gap-2.5">
          <h3 className="text-list-row font-620 tracking-list-row">{name}</h3>
          {tag ? (
            <span className="rounded-xs bg-background px-2.25 text-caption font-600 text-ink-a50">
              {tag}
            </span>
          ) : null}
        </div>
        <p className="text-caption font-500 text-ink-a50 text-pretty">{description}</p>
      </div>
      <div className="flex min-h-47.5 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ink/15 bg-background p-4.5">
        {children}
      </div>
      <div className="flex flex-col gap-1.5">
        <SectionLabel as="h4" className="text-ink/35">
          {t("paramsLabel")}
        </SectionLabel>
        <p className="text-caption font-500 text-ink-a60">{params}</p>
        <p className="text-caption font-500 text-ink-a40">{t("screensLabel", { screens })}</p>
      </div>
    </div>
  );
};
