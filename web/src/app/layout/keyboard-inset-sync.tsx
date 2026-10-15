"use client";

import { useEffect } from "react";

import { resolveKeyboardInset } from "@/shared/lib/keyboard-inset";

// Publishes the on-screen keyboard's height as --keyboard-inset, which is
// what `min-h-app` (globals.css) subtracts from the screen's height. Renders
// nothing.
//
// Mounted in root-layout outside both gates, in both DEV_MODE branches: a
// keyboard can open on any screen with a field, and the variable has to be
// correct before the screen that reads it renders — not after a gate lets it
// through.
export const KeyboardInsetSync = () => {
  useEffect(() => {
    // Absent on no browser this app supports, but it is still an optional
    // API: without it the variable keeps its 0px default and every screen
    // behaves exactly as it did before this component existed.
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;

    const apply = () => {
      const inset = resolveKeyboardInset({
        innerHeight: window.innerHeight,
        viewportHeight: viewport.height,
      });
      root.style.setProperty("--keyboard-inset", `${inset}px`);
    };

    apply();
    // "resize" is the keyboard opening and closing. "scroll" is deliberately
    // NOT listened to: the visual viewport scrolls on every pan, the measured
    // height does not change with it, and re-running this on each scroll
    // frame would cost a style recalculation for nothing.
    viewport.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      viewport.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      // Back to the 0px declared in globals.css, rather than leaving the
      // last measured keyboard height behind on an unmount.
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);

  return null;
};
