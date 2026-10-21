// Whether a haptic overlay is worth mounting in this environment at all
// (ADR 0040 — the research behind the mechanism, and why no library does
// this for us).
//
// Two conditions, and both are about cost rather than certainty:
//
//  * `switch` on HTMLInputElement is WebKit's own reflected attribute
//    (Safari 17.4), and `<input type="checkbox" switch>` is the single
//    control in the platform that asks iOS for a system tick. A browser
//    that does not know the attribute cannot produce one, so the overlay
//    there is pure cost;
//  * a coarse pointer means a finger. On a trackpad or a mouse there is
//    nothing to feel, and the overlay would still swallow the hover and
//    the press state of the button underneath it.
//
// What this function CANNOT answer: whether the phone has System Haptics
// switched on (Settings → Sounds & Haptics). With it off the control is a
// silent no-op and the page has no way to find out — see ADR 0040,
// "Последствия".
//
// Client-only, like isStandaloneDisplayMode: `matchMedia` does not exist
// while the server renders. Any failure reads as "not suitable", because
// the tick is a decoration and must never be load-bearing.
export const supportsHapticTap = (): boolean => {
  try {
    return (
      "switch" in HTMLInputElement.prototype
      && window.matchMedia("(pointer: coarse)").matches
    );
  } catch {
    return false;
  }
};
