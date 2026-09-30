"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import { SheetHeader, SheetTitle } from "@/shared/ui/sheet";

import { useInstallCarousel } from "../model/use-install-carousel";
import { STEP_IMAGES, STEP_KEYS } from "../model/steps";

// Only Safari on iPhone ever reaches this screen (ADR 0016) — the
// instructions don't branch by OS, unlike the previous PWA version of
// this screen. Layout is tightened up (user request): the subtitle and
// footnote are gone, vertical spacing around the navigation row is
// trimmed to a minimum, so the panel fits a reasonable share of the
// screen height (see ADR 0018).
export const InstallCarousel = () => {
  const t = useTranslations("screens.installApp.sheet");
  const { step, stepKey, stepCount, goToStep, goToPrevStep, goToNextStep } = useInstallCarousel();

  return (
    <>
      <SheetHeader className="px-4 pt-1.5 pb-0 text-center">
        <SheetTitle className="text-list-row font-620 tracking-list-row">{t("title")}</SheetTitle>
      </SheetHeader>

      <div className="flex flex-col items-center gap-2 px-4">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-background">
          <Image
            src={STEP_IMAGES[stepKey]}
            alt={t(`steps.${stepKey}.imageAlt`)}
            fill
            sizes="343px"
            className="object-cover"
            priority={step === 0}
          />
        </div>

        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="plain" size="icon" onPress={goToPrevStep} aria-label={t("prevLabel")}>
            <ChevronLeftIcon size={18} />
          </Button>

          <p className="text-caption font-600 text-ink-muted">
            {t("stepLabel", { step: step + 1, total: stepCount })}
          </p>

          <Button variant="plain" size="icon" onPress={goToNextStep} aria-label={t("nextLabel")}>
            <ChevronRightIcon size={18} />
          </Button>
        </div>

        <p className="w-full px-10 min-h-11 text-center text-body font-500 text-ink">{t(`steps.${stepKey}.text`)}</p>

        <div className="flex items-center">
          
          {STEP_KEYS.map((key, index) => (
            <button
              key={key}
              type="button"
              aria-current={index === step ? "step" : undefined}
              aria-label={t("stepLabel", { step: index + 1, total: stepCount })}
              onClick={() => goToStep(index)}
              className="flex h-11 w-5 items-center justify-center"
            >
              <span
                className={
                  index === step
                    ? "h-2 w-4 rounded-full bg-hero transition-all"
                    : "h-2 w-2 rounded-full bg-ink/18 transition-all"
                }
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
