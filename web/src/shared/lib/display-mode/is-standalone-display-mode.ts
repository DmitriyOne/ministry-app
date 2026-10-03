// iOS Safari/WKWebView's non-standard signal for a standalone (home-screen)
// launch — no lib.dom.d.ts type covers it. `interface` here, not `type`,
// per the project's rule for augmenting a third-party global (see sw.ts).
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// Whether the page was launched as an installed app rather than in an
// ordinary browser tab. Client-only: `matchMedia` does not exist during
// server rendering, so call this from an effect or an event handler, never
// during render. Defensive by design — any failure reads as "not
// standalone".
export const isStandaloneDisplayMode = (): boolean => {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches
      || window.matchMedia("(display-mode: fullscreen)").matches
      || window.navigator.standalone === true
    );
  } catch {
    return false;
  }
};
