"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import { useLaunchGate } from "../model/use-launch-gate";

type LaunchGateProps = {
  // Server-rendered overlay content (translated via getTranslations, see
  // launch-loading.tsx) — passed in as a prop rather than imported so this
  // file stays a plain client component with no next-intl/server
  // dependency of its own.
  loading: ReactNode;
  children: ReactNode;
};

// Decides whether the app was launched from its home-screen icon
// (display-mode: standalone) and, if not, sends the visitor to /install —
// see useLaunchGate (model/use-launch-gate.ts) for the detection/redirect
// logic itself. This component only owns presentation: which of the
// loading overlay and the app content is mounted for a given phase, and
// the overlay's own exit transition.
export const LaunchGate = ({ loading, children }: LaunchGateProps) => {
  const { phase, settle } = useLaunchGate();

  return (
    <>
      {phase !== "ready" && (
        <div
          id="shell-loading"
          role="status"
          className={cn(
            "shell-loading fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background",
            phase === "exiting" && "shell-loading-exit",
          )}
          onTransitionEnd={(event) => {
            // opacity and filter both transition over the same duration —
            // only act on one of the two transitionend events they fire,
            // and only for this element, not a bubbled event from
            // something inside `loading` (e.g. the spinner's own
            // animation, which is a different event type, but this stays
            // defensive regardless).
            if (event.target === event.currentTarget && event.propertyName === "opacity") settle();
          }}
        >
          {loading}
        </div>
      )}
      {phase !== "loading" && (
        <div
          className={cn(
            "flex min-h-full flex-1 flex-col",
            // Only while the overlay is on its way out. The animation
            // blurs this element, and a filter — `blur(0)` included —
            // makes it the containing block for every fixed descendant,
            // which here means the toaster and the navigation bar (see
            // the note on .shell-content-enter in globals.css). Keeping
            // the class after the animation has served its purpose is
            // what put the toasts at the top of the document instead of
            // the top of the screen.
            phase === "exiting" && "shell-content-enter",
          )}
        >
          {children}
        </div>
      )}
    </>
  );
};
