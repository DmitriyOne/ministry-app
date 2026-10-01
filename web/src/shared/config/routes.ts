// The single place every route literal in the app is written down — see
// ADR 0030. Before this module the same six paths were re-typed across
// web/proxy.ts, features/launch-gate/model/use-launch-gate.ts, the
// not-found/server-error screens and the footer, with nothing keeping
// them in sync.
//
// shared/config must not know about anything above it (app/pages/
// widgets/features) — this file only exports plain path strings, no
// components, no navigation logic, no domain text.
export const routes = {
  root: "/",
  day: "/day",
  soon: "/soon",
  install: "/install",
  about: "/about",
  accessDesktop: "/access/desktop",
  accessAndroid: "/access/android",
  accessIosBrowser: "/access/ios-browser",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
