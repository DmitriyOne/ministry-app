// How long a toast stays before it starts leaving, and how long the exit
// animation is given before the toast is removed regardless.
//
// exitFallbackMs is the safety net, not the animation length: under
// prefers-reduced-motion there is no animation, so animationend never
// fires, and a backgrounded tab can swallow the event too. It therefore
// has to outlast the 300ms exit animation in toast-region.tsx — keep the
// two in step by hand, since a Tailwind utility class is not readable
// from here.
export const TOAST_CONFIG = {
  visibleMs: 4000,
  exitFallbackMs: 500,
} as const;
