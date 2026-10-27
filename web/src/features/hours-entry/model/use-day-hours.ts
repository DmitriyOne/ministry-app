"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { currentDayKey, type DayKey } from "@/entities/ministry-day";
import { APP_EVENTS } from "@/shared/config";
import { isOffline } from "@/shared/lib/browser";
import { showToast } from "@/shared/ui/sonner";

import { setDayHours } from "../api/set-day-hours-action";
import { addMinutes } from "./hours-value";
import {
  HOURS_SAVE_ATTEMPTS,
  HOURS_SAVE_DELAY_MS,
  HOURS_SAVE_LOCK_MS,
  HOURS_SAVE_REQUEST_TIMEOUT_MS,
  HOURS_SAVE_RETRY_DELAY_MS,
  HOURS_SAVED_SHOWN_MS,
  type HoursSaveState,
  needsSave,
  reactionTo,
  type RollbackReason,
  rollbackTarget,
  type SettledSaveReaction,
  type SetDayHoursStatus,
} from "./hours-save";

// What the person is told when the number comes off, one sentence per
// reason. A full map rather than a chain of conditions, for the reason
// NetworkGate has one (CLAUDE.md): a fifth reason will not compile until
// it has something to say.
const ROLLBACK_MESSAGE = {
  offline: "saveOffline",
  refused: "saveRefused",
  signedOut: "saveSignedOut",
  unreachable: "saveFailed",
} as const satisfies Record<RollbackReason, string>;

type UseDayHoursOptions = {
  day: DayKey;
  // The calendar the day above was named in — the person's own zone, as
  // the screen read it from their profile. The card needs it to notice
  // midnight: comparing against the DEVICE's zone would call every save
  // a day apart for anyone whose phone is not in the profile's zone.
  timeZone: string | null;
  // What the database held for this day when the screen was rendered.
  // Read ONCE, at mount: from then on the person's taps are the truth
  // about the number and a re-render must not pull it back. The card is
  // keyed by the day, so another day is another mount — which is also
  // why nothing here watches this value.
  savedMinutes: number;
};

const wait = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

// Says, to whoever is listening, that a request got no answer. The
// connectivity gate hears it and probes: while it believes the app is
// online it has no other reason to ask (ADR 0055), so without this an
// outage that leaves the Wi-Fi connected shows up as a card that saves
// nothing and says nothing until the person switches apps and comes
// back — which is how the owner met it (2026-10-27).
//
// Not addressed to the gate: `features` may not import each other, and
// the name both sides agree on lives in shared/config.
const suspectConnectivity = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(APP_EVENTS.connectivitySuspect));
  }
};

// One attempt, with a deadline of its own. A Server Action is a request:
// it can return a status, it can reject (the phone lost signal mid-tap),
// and it can do neither — and all three have to come back as a status,
// or the loop below stops looping. An answer that arrives after the
// deadline is simply ignored; the write is idempotent, so the retry that
// has already gone out does no harm.
const attemptSave = (
  input: { day: DayKey; minutes: number; settled: boolean },
): Promise<SetDayHoursStatus> => new Promise((resolve) => {
  // Both of the client's own failures are "we do not know": the request
  // had left the phone, so the row may be written and only the answer
  // missing. The one case where we DO know is handled before we get
  // here — see the offline check in `flush`.
  const deadline = setTimeout(() => resolve("unknown"), HOURS_SAVE_REQUEST_TIMEOUT_MS);

  setDayHours(input)
    .then((answer) => answer.status)
    .catch((): SetDayHoursStatus => "unknown")
    .then((status) => {
      clearTimeout(deadline);
      resolve(status);
    });
});

// The card saves itself: there is no Save button (the owner's rule), so
// every tap both moves the number and, a moment later, puts it on the
// server.
//
// Four things make that safe, and they are the whole reason this hook
// exists rather than an `onTap` that awaits an action:
//
//   * the number on screen is the person's. It changes at the tap and
//     never waits for the network, so the card cannot feel slow — and it
//     is taken back ONLY when an answer says the server does not have it.
//   * a burst of taps is one save. The quick-add row and the two
//     steppers put three or four taps inside a second; the timer gathers
//     them and sends the number they settled on.
//   * saves do not overtake each other. One save runs at a time and
//     loops until the server holds what the screen shows, so the last
//     tap wins — rather than whichever request happened to come back
//     last.
//   * nothing is written to yesterday. The day was decided when the
//     screen was rendered, and a page left open past midnight would
//     otherwise go on writing to it — overwriting what is already there.
export const useDayHours = ({ day, savedMinutes, timeZone }: UseDayHoursOptions) => {
  const t = useTranslations("screens.day.hours");
  const router = useRouter();
  const [minutes, setMinutes] = useState(savedMinutes);

  // What the header says, and whether the buttons are the person's to
  // press. Two values rather than one, because they do not end
  // together: the lock is capped at two seconds (see the constant),
  // while "Saving…" stands for as long as the save really takes.
  const [saveState, setSaveState] = useState<HoursSaveState>("idle");
  const [isLocked, setIsLocked] = useState(false);

  // Three refs, none of which may cause a render: what the screen shows
  // (`target` — the save reads it without subscribing to it), what the
  // server is known to hold, and whether a save is already running.
  const targetRef = useRef(savedMinutes);
  const confirmedRef = useRef(savedMinutes);
  const savingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlock = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }

    setIsLocked(false);
  }, []);

  // Sends one value until there is an answer to act on. Separate from
  // the loop below so that the three outcomes the card reacts to are
  // the three it can actually receive: `reactionTo` turns the last
  // attempt into "unconfirmed" itself.
  const settleSave = useCallback(async (value: number): Promise<SettledSaveReaction> => {
    for (let attempt = 1; attempt <= HOURS_SAVE_ATTEMPTS; attempt += 1) {
      // `settled` is what spares /day a re-read per tap: only the save
      // that nothing is already queued behind revalidates the route
      // (ADR 0062).
      const status = await attemptSave({
        day,
        minutes: value,
        settled: !needsSave(targetRef.current, value),
      });

      // On the first failed attempt, not after the last: the gate's
      // probe then runs alongside the retries, so by the time the card
      // has finished asking, the screen already says what is wrong — or
      // the probe came back fine and the trouble was never the network.
      if (status === "unreachable" || status === "unknown") suspectConnectivity();

      const reaction = reactionTo(status, attempt);

      if (reaction.kind !== "retry") return reaction;

      await wait(HOURS_SAVE_RETRY_DELAY_MS);
    }

    return { kind: "unconfirmed" };
  }, [day]);

  const flush = useCallback(async () => {
    // The running save will pick up whatever has changed since: it loops
    // until the server holds the number on screen.
    if (savingRef.current) return;

    savingRef.current = true;

    // The buttons go out of reach while the request is away — the
    // owner's call, so that a save in flight cannot be tapped over a
    // dozen times by somebody who is not sure it registered. Released
    // either when the save settles or after HOURS_SAVE_LOCK_MS,
    // whichever comes first: a card locked for the full length of three
    // failing attempts would be worse than the problem.
    //
    // It costs nothing in an ordinary burst: the save starts 600 ms
    // after the LAST tap, so a run of quick taps is over before this
    // happens.
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    setSaveState("saving");
    setIsLocked(true);
    lockTimerRef.current = setTimeout(unlock, HOURS_SAVE_LOCK_MS);

    // What the header will say once this is over. "saved" only where
    // the server took the number; every way out below that is not that
    // sets it back, because a toast is already saying what happened and
    // a tick beside it would contradict it.
    let outcome: HoursSaveState = "idle";

    try {
      while (needsSave(targetRef.current, confirmedRef.current)) {
        // Midnight, or a page that came back from being frozen since
        // yesterday evening — which is exactly what the
        // `visibilitychange` flush below walks into. The day this card
        // was drawn for is no longer the day it is, and writing anyway
        // would not just record the hours in the wrong place: it would
        // REPLACE what yesterday already holds. So nothing is sent, and
        // the screen is asked for the day it is now (the card is keyed by
        // the day, so it comes back empty for today).
        if (currentDayKey(timeZone) !== day) {
          outcome = "idle";
          showToast({ message: t("saveDayChanged"), tone: "negative" });
          router.refresh();

          return;
        }

        const value = targetRef.current;
        // No connection at all: the one failure that needs no guessing.
        // Nothing can leave the device, so nothing was written, and the
        // card says that straight away instead of spending three
        // attempts to learn what the browser already knows. Found by the
        // owner, 2026-10-27: with the network off the taps moved the
        // number and nobody was told anything until the gate took the
        // screen away.
        //
        // Asked here, per attempt, rather than once on mount: the
        // connection goes while the screen is open, which is exactly the
        // case this is about.
        const reaction: SettledSaveReaction = isOffline()
          ? { kind: "rollback", reason: "offline" }
          // One value, up to three attempts. Sending the same number
          // again is safe — the write is an upsert keyed by (person,
          // day) — and it is the only honest answer to "we did not hear
          // back", since the row may well have been written and only the
          // reply lost.
          : await settleSave(value);

        if (reaction.kind === "keep") {
          confirmedRef.current = value;
          outcome = "saved";

          continue;
        }

        if (reaction.kind === "unconfirmed") {
          // The number stays. We do not know whether the row was
          // written, and taking it away would be a statement — the one
          // that used to be made here, and that was wrong whenever the
          // write had landed and only the reply was lost. `confirmedRef`
          // is left alone, so the next tap sends the whole value again.
          outcome = "idle";
          showToast({ message: t("saveUnconfirmed"), tone: "negative" });

          return;
        }

        // We know the server does not have it — either because it said
        // so, or because the request never got to it. Only the delta
        // that failed comes off: taps made while the request was away
        // were never sent to anybody.
        const next = rollbackTarget(targetRef.current, confirmedRef.current, value);

        outcome = "idle";
        targetRef.current = next;
        setMinutes(next);
        showToast({ message: t(ROLLBACK_MESSAGE[reaction.reason]), tone: "negative" });

        return;
      }
    } finally {
      savingRef.current = false;
      unlock();
      setSaveState(outcome);

      if (outcome === "saved") {
        savedTimerRef.current = setTimeout(() => {
          savedTimerRef.current = null;
          setSaveState("idle");
        }, HOURS_SAVED_SHOWN_MS);
      }
    }
  }, [day, router, settleSave, t, timeZone, unlock]);

  // The latest flush, reachable from a listener that is registered once.
  // Without it the effect below would re-subscribe whenever `flush`
  // changes identity, and its cleanup — which sends a pending save —
  // would fire on a re-render rather than on the way out.
  const flushRef = useRef(flush);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const change = useCallback((delta: number) => {
    // Computed from the ref rather than inside the state updater: an
    // updater must be pure, and writing the target from inside one makes
    // it run twice under StrictMode. The ref is what the screen shows,
    // the state is how it gets drawn.
    const next = addMinutes(targetRef.current, delta);

    targetRef.current = next;
    setMinutes(next);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flushRef.current();
    }, HOURS_SAVE_DELAY_MS);
  }, []);

  // A tap and then the phone goes in a pocket: iOS freezes the page and
  // may never run the pending timer, so the last change would be lost
  // for the sake of six hundred milliseconds. `visibilitychange` is the
  // event that actually fires there (`beforeunload` does not).
  //
  // Honest limit: this sends the save, it does not guarantee delivery. A
  // page iOS unloads rather than freezes takes the request with it —
  // `keepalive` is not available to a Server Action call — so the
  // narrow case "tapped, locked the phone, and the system discarded the
  // page before the request finished" can still lose the last change.
  // The next visit to the screen shows what the server holds, which is
  // why it costs a change rather than a wrong number.
  //
  // Registered once, on mount, which is what makes the cleanup mean
  // "leaving" and nothing else.
  useEffect(() => {
    const flushNow = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      void flushRef.current();
    };

    const onHidden = () => {
      if (document.visibilityState === "hidden") flushNow();
    };

    document.addEventListener("visibilitychange", onHidden);

    return () => {
      document.removeEventListener("visibilitychange", onHidden);

      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

      // Leaving the screen with a tap still pending: the same loss as
      // above, so the same answer. The request outlives the component —
      // it is a fetch, not a render — and if it fails there is nothing
      // left to roll back or to tell, which is the honest cost of
      // leaving.
      if (timerRef.current) flushNow();
    };
  }, []);

  return { change, isLocked, minutes, saveState };
};
