import * as Sentry from "@sentry/nextjs";

import { APP_VERSION } from "@/shared/config";

// Which version this DEVICE has shown its owner, kept beside the
// authoritative record in `profiles.whats_new_seen`.
//
// Why a second copy exists at all. The dot on the profile row is drawn
// on the server from the database, and a back navigation in Next 16 does
// not re-render the screen: it replays the payload the router already
// has, with the staleness check deliberately bypassed (`readFromBFCache`
// passes -1 instead of the current time). So the dot came back lit after
// the screen had been read — the bug the owner found.
//
// The first fix evicted that cached payload with `revalidatePath`, which
// worked and cost a visible flicker on every exit from this screen: the
// eviction turns a back navigation into a server round trip, and the
// route group changes at the same moment (/whats-new is outside
// (with-bottom-nav)), so the screen is rebuilt instead of replayed. The
// owner saw that too, and it is the worse of the two faults — it happens
// every time, not once per release.
//
// So the dot is told the truth on the client instead. A local record
// needs no network, no revalidation and no cache eviction, and it is
// honest about what it knows: "this browser has displayed x.y.z". The
// database stays the record for every OTHER device, which is why the
// write still happens there.
//
// localStorage can be absent or throw — a private window, blocked site
// data (CLAUDE.md's storage rule) — so every access is wrapped and the
// failure path is "we know nothing locally", which lands back on the
// server's answer rather than on an error.
const STORAGE_KEY = "ministry.whats-new-seen";

// Reported to Sentry rather than swallowed, at `warning`: a refusal is
// EXPECTED in a private window or with site data blocked, so it is not an
// error to be woken up for — but it is not nothing either, because the
// dot then behaves as it did before this record existed, and without a
// line anywhere that would be indistinguishable from the bug coming back.
// Tagged and deduplicated by `fingerprint` so a device that refuses on
// every visit groups into one issue instead of a stream.
//
// Sentry is off outside production (ADR 0041), so locally this is silent
// by design; the console line carries the same facts.
const report = (error: unknown, operation: "read" | "write"): void => {
  console.warn("[whats-new] local seen-version store unavailable", { operation });

  Sentry.captureException(error, {
    level: "warning",
    tags: { scope: "whats-new", operation },
    fingerprint: ["whats-new-seen-store", operation],
  });
};

export const readSeenVersion = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    // Reported, like the write below, but it is the harmless direction:
    // "this device knows nothing" falls back to the server's answer, so
    // at worst the dot stays lit one visit longer.
    report(error, "read");

    return null;
  }
};

export const rememberSeenVersion = (): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, APP_VERSION);
  } catch (error) {
    // The database write in markWhatsNewSeen is still the record that
    // matters; what is lost here is the shortcut that clears the dot
    // without a round trip. The dot then goes out on the next full load
    // of the profile instead of immediately.
    report(error, "write");
  }
};
