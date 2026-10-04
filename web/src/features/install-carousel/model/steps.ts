export const STEP_KEYS = ["step1", "step2", "step3", "step4", "step5"] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export const STEP_IMAGES: Record<StepKey, string> = {
  step1: "/pwa/ios/step-1.webp",
  step2: "/pwa/ios/step-2.webp",
  step3: "/pwa/ios/step-3.webp",
  step4: "/pwa/ios/step-4.webp",
  step5: "/pwa/ios/step-5.webp",
};
