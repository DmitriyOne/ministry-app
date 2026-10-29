import { resolveTimeZone } from "./time-zone";

// The person's own time zone, remembered on THIS device.
//
// Why a copy of a column exists here. The bare /day is not a screen but
// a redirect: it reads profiles.time_zone, works out which day today is
// in that calendar and sends the person to /day/2026-10-29. That is one
// server hop, and on it the loading boundary is drawn, torn down and
// drawn again for the address it lands on — the flicker the owner saw
// when opening the day from the menu, and never saw stepping between
// days, because those links carry the date already.
//
// The menu cannot work the date out by itself: the zone belongs to a row
// in the database, and the server could only read it by reading the
// session cookie, which would make every screen in the group dynamic —
// including three placeholders that are prerendered today. So the zone
// is kept where the browser can reach it without asking anybody: the day
// screen has it already, writes it down once, and the menu reads it and
// links straight to the date.
//
// The device's OWN zone is deliberately not used in its place. It is
// usually the same, and when it is not it runs ahead of the person's
// calendar, so the link would offer a day they have not lived yet — an
// address this app answers with a 404 on purpose.
//
// localStorage can be absent or throw (a private window, blocked site
// data — CLAUDE.md's storage rule), so every access is wrapped. The
// failure path is "this device knows nothing", which is exactly the
// behaviour of before: the menu points at /day and pays the hop.
const STORAGE_KEY = "ministry.time-zone";

// No Sentry here, unlike the what's-new store (ADR 0057): what is lost
// is one navigation's smoothness, not the truth of anything on screen,
// and the screen that pays for it says so by flickering. A console line
// is enough to recognise it while developing.
const warn = (operation: "read" | "write"): void => {
  console.warn("[time-zone] local store unavailable", { operation });
};

export const readStoredTimeZone = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    warn("read");

    return null;
  }
};

// Takes what the profile held, null included: a person who has set no
// zone is served from DEFAULT_TIME_ZONE, so writing down what
// resolveTimeZone makes of null records the calendar the server is
// actually using rather than a guess.
export const rememberTimeZone = (timeZone: string | null | undefined): void => {
  try {
    // Validated on the way in, not on the way out: what is stored is
    // then always a zone this app accepts, and a record written by an
    // older build — or edited by hand — cannot make the menu build an
    // address from a calendar that does not exist.
    window.localStorage.setItem(STORAGE_KEY, resolveTimeZone(timeZone));
  } catch {
    warn("write");
  }
};

// `storage` fires in OTHER tabs of the same origin. Nothing depends on
// it — a phone has one — but useSyncExternalStore asks for a
// subscription, and this is the honest one to give it.
export const subscribeToStoredTimeZone = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
};
