"use client";

import { useTranslations } from "next-intl";

import { SCREEN_KEYS, USAGE_MATRIX } from "./usage-matrix-data";

const MARK: Record<number, string> = { 0: "·", 1: "●", 2: "○" };
const COLOR: Record<number, string> = {
  0: "text-ink/20",
  1: "text-primary",
  2: "text-ink-a45",
};

export const UsageMatrix = () => {
  const t = useTranslations("showcase.components.matrix");

  return (
    <div className="grid grid-cols-[200px_repeat(6,1fr)] text-caption">
      <div className="pb-2.5 font-500 text-ink-a45">{t("componentHeader")}</div>
      {SCREEN_KEYS.map((screenKey) => (
        <div key={screenKey} className="pb-2.5 text-center font-600">
          {t(`screens.${screenKey}`)}
        </div>
      ))}
      {USAGE_MATRIX.map(([name, ...values]) => (
        <div key={name} className="contents">
          <div className="border-t border-ink-a07 py-2.5 font-500 tracking-tight">{name}</div>
          {values.map((value, i) => (
            <div
              key={SCREEN_KEYS[i]}
              className={`border-t border-ink-a07 py-2.5 text-center font-600 ${COLOR[value]}`}
            >
              {MARK[value]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
