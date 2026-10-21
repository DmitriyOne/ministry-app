"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { supportsHapticTap } from "@/shared/lib/browser";

// WebKit's own attribute (Safari 17.4); no React type covers it.
// `interface`, not `type`, because augmenting a third-party declaration
// requires one — the same exception src/app/sw.ts takes for
// `declare global`.
//
// Typed as a STRING, and that is the whole bug this file was shipped
// with: React does not write a boolean `true` to an attribute it does not
// know, it logs "Received `true` for a non-boolean attribute" and emits
// nothing. The overlay was therefore an ordinary checkbox, a control iOS
// has no tick for, and no amount of touching it could have worked. With
// `switch=""` the attribute lands, and presence is all WebKit asks for.
declare module "react" {
  // The type parameter is part of the declaration being augmented, not
  // ours to drop.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface InputHTMLAttributes<T> {
    switch?: string;
  }
}

// A system haptic tick on a real touch, and nothing else (ADR 0040).
//
// The whole mechanism is this: `<input type="checkbox" switch>` is the one
// control in WebKit that asks iOS for a tick, and Apple has twice closed
// the SCRIPT path to it while deliberately keeping — and regression-testing
// — the tick on a trusted touch. So the control is real, it is laid over
// the button, and the finger lands on IT.
//
// Four rules, each one load-bearing, all four measured by project-fathom
// and recorded in ADR 0040:
//
//  * the native appearance is not removed. `appearance: none` kills the
//    tick along with the look, so this element carries no such class and
//    must never be given one;
//  * `opacity-0`, never `hidden` or `display: none` — a hidden control
//    receives no touch;
//  * `absolute inset-0 size-full`: the control's own size is tiny and
//    would leave dead zones inside the button;
//  * `clip-path`, not `rounded-*`. A radius with `overflow: hidden` clips
//    the painting and not the hit area, so a tap on the corner outside the
//    pill would still tick.
//
// It is a SIBLING of the button, not a child: our buttons are real
// `<button>` elements and an interactive element inside one is invalid
// HTML. That has three consequences worth knowing before using this:
//
//  * the touch never reaches the button, so `onPress` is not what fires —
//    `onChange` here is. Keep both pointing at the same handler: the
//    button stays the keyboard and VoiceOver path, this is the finger's.
//    They cannot both fire for one gesture, because the button is not an
//    ancestor of this input and the event has nothing to bubble through;
//  * `pressable` on the button would never see `:active` for the same
//    reason. The `.haptic-tap` rule in globals.css drives it from this
//    control's own `:active` instead, so the child button is expected to
//    carry `pressable`;
//  * `aria-hidden` plus `tabIndex={-1}` keep it away from assistive
//    technology, and the price — named in ADR 0040 — is no tick when the
//    button is activated through VoiceOver.
//
// The control's checked state is ignored: the finger flips it on every tap
// and nothing reads it. It stays uncontrolled on purpose, which is also
// why React does not warn about a checkbox without `checked`.
type HapticTapProps = {
  // Runs on a real touch of the overlay. The same handler belongs on the
  // child button, which is what a keyboard or VoiceOver activates.
  onTap: () => void;
  // The hit area's shape, which must match the button's own radius.
  radius: "full" | "sm";
  // Mirrors the child button's own disabled state. The overlay has to be
  // told as well: a control that cannot act must not tick either, and a
  // tick on a tap that changes nothing is worse than silence.
  isDisabled?: boolean;
  // The visible control. Give it `pressable` to keep the press animation.
  children: ReactNode;
  className?: string;
};

const OVERLAY_CLIP: Record<HapticTapProps["radius"], string> = {
  full: "[clip-path:inset(0_round_9999px)]",
  sm: "[clip-path:inset(0_round_var(--radius-sm))]",
};

// The environment answer is a fact about the browser, not state: read
// through useSyncExternalStore (never an effect plus setState, which the
// project's lint rules forbid) so the server renders without the overlay
// and the client decides once, after hydration.
const subscribe = () => () => {};
const getSnapshot = () => supportsHapticTap();
const getServerSnapshot = () => false;

export const HapticTap = ({ onTap, radius, isDisabled, children, className }: HapticTapProps) => {
  const supported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <span className={cn("haptic-tap relative inline-flex", className)}>
      {children}
      {supported && (
        <input
          type="checkbox"
          switch=""
          aria-hidden="true"
          tabIndex={-1}
          disabled={isDisabled}
          onChange={onTap}
          className={cn("absolute inset-0 m-0 size-full opacity-0", OVERLAY_CLIP[radius])}
        />
      )}
    </span>
  );
};
