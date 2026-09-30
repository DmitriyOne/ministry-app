"use client";

import { useState } from "react";

import { STEP_KEYS, type StepKey } from "./steps";

type UseInstallCarouselResult = {
  step: number;
  stepKey: StepKey;
  stepCount: number;
  goToStep: (index: number) => void;
  goToPrevStep: () => void;
  goToNextStep: () => void;
};

// The carousel loops (user's decision): "back" from the first step wraps
// to the last, "forward" from the last wraps to the first, so the
// arrows are never disabled (unlike the previous version with
// isFirst/isLast).
export const useInstallCarousel = (): UseInstallCarouselResult => {
  const [step, setStep] = useState(0);

  const goToPrevStep = () => setStep((current) => (current - 1 + STEP_KEYS.length) % STEP_KEYS.length);
  const goToNextStep = () => setStep((current) => (current + 1) % STEP_KEYS.length);

  return {
    step,
    stepKey: STEP_KEYS[step],
    stepCount: STEP_KEYS.length,
    goToStep: setStep,
    goToPrevStep,
    goToNextStep,
  };
};
