"use client";

import { toast, Toaster as Sonner } from "sonner";

import { AlertCircleIcon, CheckCircleIcon } from "./icons";

export type ToastTone = "neutral" | "positive" | "negative";

export type ToastInput = {
  message: string;
  tone?: ToastTone;
  // Overrides the default duration for this toast only.
  durationMs?: number;
};

// Sonner's own id type; opaque to callers, who only hand it back to
// dismissToast.
export type ToastId = string | number;

// Which token colours the icon for each tone. The tone changes nothing else
// about the toast, the background is bg-hero throughout. Keys are typed as
// ToastTone, so adding a tone without a colour fails typecheck.
const TONE_ICON_CLASS = {
  neutral: "text-hero-foreground",
  positive: "text-positive-hero",
  // --negative-hero, not --negative: the latter is terracotta tuned for
  // light surfaces and lands at 1.73:1 on --hero, under the 3:1 a non-text
  // graphic needs. The tint is the palette's counterpart for this surface
  // (5.44:1); inline-error.tsx states the rule.
  negative: "text-negative-hero",
} as const;

const DEFAULT_DURATION_MS = 4000;

// The one place that knows sonner exists: callers say what to show and in
// which tone, and get an id back so a toast can be taken away early.
export const showToast = ({
  message,
  tone = "neutral",
  durationMs = DEFAULT_DURATION_MS,
}: ToastInput): ToastId => {
  const Icon = tone === "negative" ? AlertCircleIcon : CheckCircleIcon;

  return toast(message, {
    duration: durationMs,
    icon: <Icon size={20} className={TONE_ICON_CLASS[tone]} />,
  });
};

// Safe at any point: sonner ignores an id that has already left.
export const dismissToast = (id: ToastId) => {
  toast.dismiss(id);
};

// Vendored from the shadcn registry (@shadcn/sonner), then adapted: no
// next-themes (there is no dark theme, ADR 0011), no icon placeholder (the
// project's own icons are passed per toast in showToast), no popover/border
// variables (the palette is the project's own).
//
// `unstyled` drops sonner's visual defaults so the pill is built from tokens:
// bg-hero, text-hero-foreground, rounded-xl, shadow-mark-elevated. Sonner
// still positions the toast absolutely without a width, so `inset-x-0 mx-auto
// w-fit` centres a content-sized pill in the toaster. Top, not bottom: a
// toast reports on what was just on screen and primary actions sit at the
// bottom; the offset keeps it clear of the notch (viewport-fit=cover, ADR
// 0020). Sonner disables its own transitions under prefers-reduced-motion.
export const Toaster = () => (
  <Sonner
    position="top-center"
    offset="calc(env(safe-area-inset-top) + 1rem)"
    mobileOffset="calc(env(safe-area-inset-top) + 1rem)"
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          "inset-x-0 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-xl bg-hero px-4 py-3 text-body font-540 text-hero-foreground shadow-mark-elevated",
      },
    }}
  />
);
