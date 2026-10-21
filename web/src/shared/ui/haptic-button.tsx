"use client";

import { useSyncExternalStore, type ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";
import { supportsHapticTap } from "@/shared/lib/browser";

import { Button } from "./button";

// WebKit's own attribute (Safari 17.4); no React type covers it.
// `interface`, not `type`, because augmenting a third-party declaration
// requires one — the same exception src/app/sw.ts takes for
// `declare global`.
//
// Typed as a STRING, and that is the bug this file shipped with once:
// React does not write a boolean to an attribute it does not know. Given
// `switch={true}` it logs "Received `true` for a non-boolean attribute"
// and emits nothing at all, so the overlay was an ordinary checkbox —
// a control iOS has no tick for. `switch=""` lands it, and presence is
// all WebKit asks for.
declare module "react" {
  // The type parameter belongs to the declaration being augmented.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface InputHTMLAttributes<T> {
    switch?: string;
  }
}

// A button that answers the finger with a system haptic tick (ADR 0040 —
// the research, the WebKit patches, and why no library does this).
//
// Use it where a tap deserves to be felt, and the ordinary `Button`
// everywhere else. Not a prop on `Button`: the overlay below takes the
// touches, so switching it on for every button would break the drag
// gestures in the install sheet and the carousel.
//
// The mechanism is a real `<input type="checkbox" switch>` — the one
// control in WebKit that asks iOS for a tick — laid over the button, so
// the finger lands on IT. Four rules keep it working, and each one is
// easy to get wrong:
//
//  * the native appearance stays. `appearance: none` kills the tick along
//    with the look, so the overlay never gets such a class;
//  * `opacity-0`, never `hidden` — a hidden control receives no touch;
//  * `absolute inset-0 size-full` — the control's own size is tiny and
//    would leave dead zones inside the button;
//  * `clip-path`, not `rounded-*` — a radius clips the painting, not the
//    hit area, so a tap outside a pill's corner would still tick.
//
// Because the finger never reaches the button, two events have to run the
// same action: `change` on the overlay and `press` on the button, which is
// the keyboard and VoiceOver path. Hence one plain `onTap` prop: the first
// version of this component made the call site wire both, and every button
// repeated its handler and its disabled state twice. They cannot both fire
// for one gesture — the overlay is a SIBLING of the button (an interactive
// element inside a `<button>` is invalid HTML), so nothing bubbles.
//
// Two costs, both named in ADR 0040: no tick when the button is activated
// through VoiceOver, since the overlay is `aria-hidden`; and `:active`
// landing on the overlay, which is why the press is driven by the
// `.haptic-button` rule in globals.css rather than by `pressable`.
//
// If something that is not a button ever needs a tick, the overlay is what
// to lift out — the mechanism has nothing to do with `Button`.
type HapticButtonProps = Omit<ComponentProps<typeof Button>, "onPress"> & {
  // What the tap does. One callback for both paths; see above.
  onTap: () => void;
  // The hit area's shape, which must match the button's own radius —
  // `full` for a circle or a pill, `sm` for the 13px cards and chips.
  radius?: "full" | "sm";
};

const OVERLAY_CLIP: Record<NonNullable<HapticButtonProps["radius"]>, string> = {
  full: "[clip-path:inset(0_round_9999px)]",
  sm: "[clip-path:inset(0_round_var(--radius-sm))]",
};

// How a press reads here, and why it is not the app's usual 0.98/150ms:
// the strength of the tick itself is not ours to choose — WebKit picks
// the style and no API asks for harder — so what can be made emphatic is
// what happens under the finger in the same instant. 0.9 is the deepest
// squeeze the project already uses (the password field's toggle, ADR
// 0012); the brightening exists only here, because nothing else had
// asked. A call site may override either through `className`.
//
// `data-disabled:pointer-events-none` is not belt-and-braces, it is the
// only thing stopping a dead button from pretending: react-aria puts
// `aria-disabled` on a `<button>` and NOT the native `disabled`
// attribute (see useButton — `disabled: elementType === "input" ?
// isDisabled : undefined`), so `button.tsx`'s own
// `disabled:pointer-events-none` never matches and CSS `:active` lands
// on the button as usual. RAC does set `data-disabled`, which is the
// hook that works. Without this, tapping minus at 0:00 — or plus at
// 24:00 — squeezed and brightened exactly as if it had worked.
const PRESS_FEEL = "duration-75 data-disabled:pointer-events-none [--press-brightness:1.18] [--press-scale:0.9]";

// The environment answer is a fact about the browser, not state: read
// through useSyncExternalStore (never an effect plus setState, which the
// project's lint rules forbid) so the server renders without an overlay
// and the client decides once, after hydration.
const subscribe = () => () => {};
const getSnapshot = () => supportsHapticTap();
const getServerSnapshot = () => false;

export const HapticButton = ({
  onTap,
  radius = "full",
  isDisabled,
  className,
  children,
  ...props
}: HapticButtonProps) => {
  const hasTick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    // The element that stands in the parent's layout, so a flex row sizes
    // it by the button and a grid cell stretches it. Callers style the
    // BUTTON through `className`, as they would any other button.
    <span className="haptic-button relative inline-flex">
      <Button {...props} isDisabled={isDisabled} onPress={onTap} className={cn(PRESS_FEEL, className)}>
        {children}
      </Button>

      {/* Gone entirely while the button is disabled, rather than present
          and `disabled`: a tick on a tap that changes nothing is worse
          than silence, and a disabled control can still take the touch
          and match `:active`, which is the squeeze this is meant to
          prevent. With no overlay the tap reaches the button, which is
          `pointer-events-none` by then, so nothing happens at all. */}
      {hasTick && !isDisabled && (
        <input
          type="checkbox"
          switch=""
          aria-hidden="true"
          tabIndex={-1}
          onChange={onTap}
          className={cn("absolute inset-0 m-0 size-full opacity-0", OVERLAY_CLIP[radius])}
        />
      )}
    </span>
  );
};
