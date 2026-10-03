"use client";

import { useTranslations } from "next-intl";

import { CheckCircleIcon } from "@/shared/ui/icons";

type ConnectionRestoredToastProps = {
  isLeaving: boolean;
  onExited: () => void;
};

export const ConnectionRestoredToast = ({
  isLeaving,
  onExited,
}: ConnectionRestoredToastProps) => {
  const t = useTranslations("common");

  return (
    // Top, not bottom: the toast reports on the thing that was blocking the
    // screen, and the offline screen's own action sits at the bottom.
    // `env(safe-area-inset-top)` keeps it clear of the notch and the status
    // bar (viewport-fit=cover, ADR 0020); `pointer-events-none` so it never
    // intercepts a tap meant for what is underneath.
    <div className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+--spacing(4))] z-50 flex justify-center">
      <div
        role="status"
        aria-live="polite"
        // Enter and exit come from tw-animate-css (already imported in
        // globals.css), driven by data-state the way shadcn components do it.
        // `onAnimationEnd` is what removes the toast from the tree, and the
        // hook keeps a timer in case the animation never runs at all — under
        // prefers-reduced-motion `animate-none` means there is no animation
        // to end.
        //
        // `fill-mode-both` is not optional here. tw-animate-css leaves
        // animation-fill-mode at `none`, so the moment the exit animation
        // finishes the element reverts to its ordinary styles — fully opaque
        // and back in place — for the frame between the animation ending and
        // React unmounting it. That reads as the toast flashing back on
        // screen as it leaves.
        data-state={isLeaving ? "closed" : "open"}
        onAnimationEnd={() => {
          if (isLeaving) onExited();
        }}
        className="flex items-center gap-2.5 rounded-xl bg-hero px-4 py-3 text-body font-540 text-hero-foreground shadow-mark-elevated duration-300 ease-out fill-mode-both data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-4 motion-reduce:animate-none"
      >
        <CheckCircleIcon size={20} className="text-positive-hero" />
        {t("connectionRestored")}
      </div>
    </div>
  );
};
