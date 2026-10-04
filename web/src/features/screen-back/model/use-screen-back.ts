"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { routes } from "@/shared/config";

// This project's lib.dom.d.ts (TypeScript 6's bundled types) already
// declares `Window.navigation: Navigation` — no `declare global`
// augmentation needed, unlike `Navigator.standalone` in
// features/launch-gate/model/use-launch-gate.ts. The type is misleading
// though: it's declared non-optional, but Safari on iOS doesn't actually
// have the Navigation API at all before version 26.2 —
// https://caniuse.com/mdn-api_navigation_cangoback (Chrome has had it
// since 102). At runtime, on an unsupported browser, `window.navigation`
// is simply `undefined` despite what the type says — the `?.` below is
// load-bearing even though TypeScript doesn't require it, and the whole
// check still runs inside try/catch in case reading it throws in some
// other unexpected way.
//
// Replaces the previous sessionStorage-flag approach (ADR 0029's
// back-button decision) with a direct capability check. That flag existed
// only to tell a client-side arrival at /about (via the footer's next/link navigation)
// apart from a direct load, because document.referrer never sees a
// pushState navigation and window.history.back() risked leaving the app
// entirely (landing on about:blank) when there was nothing real to go
// back to. navigation.canGoBack answers the same question directly, from
// the platform, without a bespoke per-tab marker to set and consume.
//
// - canGoBack === true → there's a real history entry in this tab to
//   return to (e.g. arrived via the footer's client-side link) —
//   router.back() (next/navigation) pops it without a full document
//   reload and without LaunchGate running again (ADR 0019/0028).
// - No support for the API, or canGoBack === false (direct load, a
//   pasted/forwarded link, a fresh tab) — fall back to a full navigation
//   to "/", same device the app's launch detection already handles: "/"
//   is one of LaunchGate's APP_SCREEN_PATHS
//   (features/launch-gate/model/use-launch-gate.ts), so it decides
//   between /day and /install on its own, same as any other fresh entry.
//   replace, not assign/push — nothing worth keeping in history at this
//   point.
//
// On older iOS Safari (no Navigation API) every "back" tap costs a full
// reload and the LaunchGate exit animation, same trade-off ADR 0029
// originally accepted for its sessionStorage fallback path — see ADR
// 0029's back-button decision for the measured cost and ADR 0030 for why
// the Navigation API replaced the flag.
export const useScreenBack = (): (() => void) => {
  const router = useRouter();

  return useCallback(() => {
    try {
      if (window.navigation?.canGoBack === true) {
        router.back();
        return;
      }
    } catch {
      // Whatever failed reading window.navigation, fall through to the
      // full-navigation fallback below — never leave the tap unhandled.
    }
    window.location.replace(routes.root);
  }, [router]);
};
