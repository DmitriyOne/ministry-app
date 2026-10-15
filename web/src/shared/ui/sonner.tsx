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

// Which token colours the mark for each tone. The tone changes nothing
// else about the toast: the plate is --card throughout. Keys are typed as
// ToastTone, so adding a tone without a colour fails typecheck.
//
// All three are measured against white, not against the deep green they
// were first chosen for: --primary is 4.9:1 and --negative 5.6:1, both
// clear of the 3:1 a non-text graphic needs.
const TONE_ICON_CLASS = {
  neutral: "text-ink-muted",
  positive: "text-primary",
  negative: "text-negative",
} as const;

const DEFAULT_DURATION_MS = 4000;

// The pill itself, as our own element rather than classes on sonner's <li>.
// Sonner injects its stylesheet at runtime as a plain <style> in <head>,
// outside any cascade layer, while every Tailwind utility sits inside
// @layer utilities — and an unlayered declaration beats a layered one
// whatever its specificity. So any property sonner declares (on phones that
// includes the toast's width) wins over our class, which is why sonner's own
// docs say Tailwind classes passed through `classNames` have to be marked
// !important. Sonner's documented way out is the headless toast, "no default
// styles + full control of the jsx", which is this: the <li> stays a bare
// positioning box sonner is free to size, and the pill is a child no rule of
// sonner's reaches.
//
// The plate is --card, not the --hero it was first built with. A deep
// green pill is invisible on a deep green screen, and /login is both the
// screen most likely to report "the server did not answer" and one of the
// two painted that colour. White reads on either background, and it makes
// the toast and the Alert plates one language instead of two.
const ToastPill = ({ message, tone }: { message: string; tone: ToastTone }) => {
  const Icon = tone === "negative" ? AlertCircleIcon : CheckCircleIcon;

  return (
    <div className="pointer-events-auto mx-auto flex w-fit max-w-full items-center gap-2.5 rounded-xl bg-card px-4 py-3 text-body font-540 text-ink shadow-mark-elevated">
      <Icon size={20} className={TONE_ICON_CLASS[tone]} />
      {message}
    </div>
  );
};

// The one place that knows sonner exists: callers say what to show and in
// which tone, and get an id back so a toast can be taken away early.
export const showToast = ({
  message,
  tone = "neutral",
  durationMs = DEFAULT_DURATION_MS,
}: ToastInput): ToastId =>
  toast.custom(() => <ToastPill message={message} tone={tone} />, { duration: durationMs });

// Safe at any point: sonner ignores an id that has already left.
export const dismissToast = (id: ToastId) => {
  toast.dismiss(id);
};

// Vendored from the shadcn registry (@shadcn/sonner), then adapted: no
// next-themes (there is no dark theme, ADR 0011), and no styling of sonner's
// own elements at all — the visible pill is ToastPill above, so `unstyled`
// and the whole classNames map are gone with it.
//
// Top, not bottom: a toast reports on what was just on screen and primary
// actions sit at the bottom; the offset keeps it clear of the notch
// (viewport-fit=cover, ADR 0020). Sonner disables its own transitions under
// prefers-reduced-motion.
export const Toaster = () => (
  <Sonner
    position="top-center"
    // Per side, not one string for all four: a single value put the TOP
    // safe-area inset into --offset-left and --offset-right as well, which
    // is meaningless there. Only the top edge has a notch to clear
    // (viewport-fit=cover, ADR 0020).
    offset={{ top: "calc(env(safe-area-inset-top) + 1rem)", left: "1rem", right: "1rem" }}
    mobileOffset={{ top: "calc(env(safe-area-inset-top) + 1rem)", left: "1rem", right: "1rem" }}
    toastOptions={{
      // Two layout classes, no visual ones. `inset-x-0` makes the <li> span
      // the toaster so `mx-auto` on the pill centres against the screen
      // (under 600px sonner sets the same two values itself, and sizes the
      // <li> to the screen minus the offsets). `pointer-events-none` is the
      // price of the <li> being wider than the pill: it is a touch target
      // with `touch-action: none`, and left alone it would swallow taps in
      // the empty space beside the pill — the pill takes them back.
      className: "pointer-events-none inset-x-0",
    }}
  />
);
