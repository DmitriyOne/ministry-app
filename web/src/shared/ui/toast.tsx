"use client";

import { AlertCircleIcon, CheckCircleIcon } from "./icons";

export type ToastTone = "neutral" | "positive" | "negative";

export type ToastInput = {
  message: string;
  tone?: ToastTone;
  // Overrides TOAST_CONFIG.visibleMs for this toast only.
  durationMs?: number;
};

export type QueuedToast = {
  id: number;
  message: string;
  tone: ToastTone;
  isLeaving: boolean;
};

// How long a toast stays before it starts leaving, and how long the exit
// animation is given before the toast is removed regardless. The second
// number is the safety net: under prefers-reduced-motion there is no
// animation, so animationend never fires, and a backgrounded tab can swallow
// the event too. It has to outlast the 300ms animation below.
export const TOAST_CONFIG = {
  visibleMs: 4000,
  exitFallbackMs: 500,
} as const;

const TONE_ICON_CLASS = {
  neutral: "text-hero-foreground",
  positive: "text-positive-hero",
  negative: "text-negative",
} as const;

type ToastRegionProps = {
  toasts: QueuedToast[];
  onExited: (id: number) => void;
};

export const ToastRegion = ({ toasts, onExited }: ToastRegionProps) => (
  // Top, not bottom: a toast usually reports on what was just on screen, and
  // primary actions sit at the bottom. `env(safe-area-inset-top)` keeps it
  // clear of the notch and the status bar (viewport-fit=cover, ADR 0020);
  // `pointer-events-none` so it never intercepts a tap meant for what is
  // underneath.
  <div className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+--spacing(4))] z-50 flex flex-col items-center gap-2">
    {toasts.map((toast) => {
      const Icon = toast.tone === "negative" ? AlertCircleIcon : CheckCircleIcon;

      return (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          // Enter and exit come from tw-animate-css (already imported in
          // globals.css), driven by data-state the way shadcn components do
          // it. `onAnimationEnd` removes the toast from the tree; the
          // provider keeps a timer in case the animation never runs at all.
          //
          // `fill-mode-both` is not optional. tw-animate-css leaves
          // animation-fill-mode at `none`, so the moment the exit animation
          // finishes the element reverts to its ordinary styles — fully
          // opaque and back in place — for the frame between the animation
          // ending and React unmounting it. That reads as the toast flashing
          // back on screen as it leaves.
          data-state={toast.isLeaving ? "closed" : "open"}
          onAnimationEnd={() => {
            if (toast.isLeaving) onExited(toast.id);
          }}
          className="flex items-center gap-2.5 rounded-xl bg-hero px-4 py-3 text-body font-540 text-hero-foreground shadow-mark-elevated duration-300 ease-out fill-mode-both data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-4 motion-reduce:animate-none"
        >
          <Icon size={20} className={TONE_ICON_CLASS[toast.tone]} />
          {toast.message}
        </div>
      );
    })}
  </div>
);
