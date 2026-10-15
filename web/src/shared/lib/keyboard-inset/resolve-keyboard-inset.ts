// How much of the layout viewport the on-screen keyboard currently covers.
//
// iOS does not shrink the layout viewport when the keyboard opens: 100dvh
// stays exactly what it was, so a screen laid out at full height keeps
// claiming the whole phone while half of it sits behind the keyboard. The
// only signal is the VISUAL viewport, which does shrink. Safari supports
// neither `interactive-widget=resizes-content` nor
// `env(keyboard-inset-height)`, so this difference is the measurement.

type KeyboardInsetInput = {
  // window.innerHeight — the layout viewport, unchanged by the keyboard.
  innerHeight: number;
  // window.visualViewport.height — what is actually visible.
  viewportHeight: number;
};

// Below this, the gap is something other than a keyboard: Safari's own
// chrome collapsing and expanding moves the visual viewport by tens of
// pixels, and treating that as a keyboard would make the layout twitch
// while the person simply scrolls. Every phone keyboard is far taller
// (the shortest, a numeric pad in landscape, is still around 160).
const MIN_KEYBOARD_INSET_PX = 120;

export const resolveKeyboardInset = ({
  innerHeight,
  viewportHeight,
}: KeyboardInsetInput): number => {
  const covered = innerHeight - viewportHeight;
  if (!Number.isFinite(covered) || covered < MIN_KEYBOARD_INSET_PX) return 0;
  return Math.round(covered);
};
