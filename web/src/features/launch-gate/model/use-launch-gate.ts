"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { routes } from "@/shared/config";
import { isStandaloneDisplayMode } from "@/shared/lib/display-mode";

// Require launching from a home-screen icon (ADR 0017), otherwise → /install.
// Paths come from shared/config/routes.ts (ADR 0030) — the single place
// these literals are written down.
// /soon is absent: it is the public landing now (ADR 0045) and opens in an
// ordinary browser tab.
const APP_SCREEN_PATHS: string[] = [
  routes.root,
  routes.day,
  routes.login,
  routes.forgotPassword,
  routes.calendar,
  routes.month,
  routes.year,
  routes.profile,
  routes.adminNewUser,
];
const INSTALL_PATH = routes.install;
const APP_ENTRY_PATH = routes.day;

// Safety net only — NOT the source of truth for the visible exit duration
// (that's --shell-transition-duration in globals.css, which the browser's
// own transition machinery reads directly). If `transitionend` never
// fires for some reason, this unblocks the app instead of leaving the
// loading overlay mounted forever. Deliberately generous and decoupled
// from the CSS variable — it only exists to catch a genuinely unexpected
// failure, not to time the animation.
const EXIT_FAILSAFE_MS = 4000;

export type LaunchGatePhase = "loading" | "exiting" | "ready";

type UseLaunchGateResult = {
  phase: LaunchGatePhase;
  // Called by ui/launch-gate.tsx once the loading overlay's own exit
  // transition has visually finished (its transitionend handler) — moves
  // phase to "ready", which unmounts the overlay entirely. Also used
  // directly by the failsafe timer below.
  settle: () => void;
};

// Replaces the old CSS-attribute shell (`data-shell` on <html> plus
// `#shell-loading`/`#shell-content` CSS switches, ADR 0019's first cut) with
// plain React state. `phase` starts at "loading" identically on the server
// and on the client's first render — no hydration mismatch — and only
// moves forward once this hook has mounted and can read client-only
// signals (display-mode/standalone).
//
// The property this buys over the old design: once `phase` reaches
// "ready", the loading overlay isn't just visually hidden by CSS — it's
// removed from the React tree entirely. It can never end up as an
// invisible layer still sitting in the hit-test order, which is exactly
// what happened on real iPhone Safari with the old CSS/@keyframes
// mechanism (see ADR 0019, "Обновление: state вместо CSS-оверлея").
export const useLaunchGate = (): UseLaunchGateResult => {
  const [phase, setPhase] = useState<LaunchGatePhase>("loading");
  const settledRef = useRef(false);

  const settle = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    setPhase("ready");
  }, []);

  // A plain useEffect, not useLayoutEffect. useLayoutEffect exists to read
  // or mutate the DOM before the browser paints, so a *visible* wrong
  // state never appears on screen — but here the pre-effect state IS the
  // intended placeholder (the loading overlay), identical to what the
  // server already sent, so there's nothing to fix before paint. Using
  // useLayoutEffect would additionally do nothing during SSR (React logs
  // a warning if it's used in code that can render on the server) and buy
  // no earlier signal, since display-mode/standalone are unreadable until
  // the client has mounted regardless of which effect hook reads them.
  useEffect(() => {
    // The whole decision runs inside a microtask, not directly in the
    // effect body — eslint-plugin-react-hooks' `set-state-in-effect`
    // flags a bare `setPhase(...)` call as a possible cascading render;
    // wrapping it the same way an external-system callback would
    // (matchMedia's own "change" event, a fetch's `.then`) satisfies the
    // rule without changing timing in any way that matters here — this
    // still resolves within the same task, well before the next paint.
    queueMicrotask(() => {
      try {
        const standalone = isStandaloneDisplayMode();
        const path = window.location.pathname;

        // A full document navigation (window.location.replace), not
        // next/navigation's router. The App Router keeps the root layout —
        // and this exact hook instance — mounted across client-side
        // navigations; router.replace would leave `phase` stuck wherever
        // this effect left it, permanently hiding the destination page
        // behind (or after) the loading overlay. A full navigation forces
        // this hook to mount fresh on the destination page, re-running this
        // same check there. This is a different concern from ADR 0024
        // (LinkButton deliberately uses next/link for in-app navigation) —
        // this redirect is about launch-state detection, not user-initiated
        // navigation.
        if (APP_SCREEN_PATHS.includes(path) && !standalone) {
          window.location.replace(INSTALL_PATH);
          return;
        }
        if (path === INSTALL_PATH && standalone) {
          window.location.replace(APP_ENTRY_PATH);
          return;
        }

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setPhase(reducedMotion ? "ready" : "exiting");
      } catch {
        // Whatever failed above, don't leave the app stuck behind the
        // loading overlay — skip straight to ready, no redirect, no
        // animation.
        setPhase("ready");
      }
    });
  }, []);

  useEffect(() => {
    if (phase !== "exiting") return;
    const failsafe = window.setTimeout(settle, EXIT_FAILSAFE_MS);
    return () => window.clearTimeout(failsafe);
  }, [phase, settle]);

  return { phase, settle };
};
