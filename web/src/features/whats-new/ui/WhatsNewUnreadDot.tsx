"use client";

import { useSyncExternalStore } from "react";

import { APP_VERSION, hasUnreadVersion } from "@/shared/config";

import { readSeenVersion } from "../lib/seen-version-store";

type WhatsNewUnreadDotProps = {
  // The server's answer, read from `profiles.whats_new_seen`. It is the
  // starting point, and the whole answer for every device but this one.
  unread: boolean;
  label: string;
};

// localStorage is an external store, so it is read through the hook
// React provides for external stores rather than in an effect. An effect
// that calls setState on mount renders twice and is what
// react-hooks/set-state-in-effect refuses — correctly: the value is
// available synchronously, and useSyncExternalStore uses the server
// snapshot while hydrating and the real one immediately after, which is
// precisely the sequence wanted here.
//
// The subscription is a bonus rather than the point: `storage` fires in
// OTHER tabs of the same origin, so a release read in one tab clears the
// dot in another. Nothing depends on it.
const subscribe = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
};

// Returns a fresh string every call, which is safe here because React
// compares snapshots with Object.is and strings compare by value.
const getSnapshot = (): string | null => readSeenVersion();

// Nothing is known about the device while rendering on the server, so the
// server's own answer stands.
const getServerSnapshot = (): string | null => null;

// The dot itself, as a client island, so that it can disagree with the
// server about one specific thing: whether THIS browser has already been
// shown this version (see lib/seen-version-store.ts for why that matters
// and what it replaced).
//
// It can only ever take the dot away, never put one there. A device that
// has read the release cannot make a dot appear on a profile the database
// says is up to date, and a local record from the future — a rolled-back
// deployment — is handled by `hasUnreadVersion`, the same comparison the
// server uses, rather than by string equality.
export const WhatsNewUnreadDot = ({ unread, label }: WhatsNewUnreadDotProps) => {
  const seenVersion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const seenOnThisDevice = seenVersion !== null && !hasUnreadVersion(seenVersion, APP_VERSION);

  if (!unread || seenOnThisDevice) return null;

  return (
    <span
      role="status"
      aria-label={label}
      className="size-2.5 rounded-full bg-primary"
    />
  );
};
