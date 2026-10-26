"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { currentDayKey, type DayKey } from "@/entities/ministry-day";
import { showToast } from "@/shared/ui/sonner";

import { setDayHours } from "../api/set-day-hours-action";
import { addMinutes } from "./hours-value";
import {
  HOURS_SAVE_ATTEMPTS,
  HOURS_SAVE_DELAY_MS,
  HOURS_SAVE_REQUEST_TIMEOUT_MS,
  HOURS_SAVE_RETRY_DELAY_MS,
  needsSave,
  reactionTo,
  rollbackTarget,
  type SettledSaveReaction,
  type SetDayHoursStatus,
} from "./hours-save";

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

// One attempt, with a deadline of its own. A Server Action is a request:
// it can return a status, it can reject (the phone lost signal mid-tap),
// and it can do neither — and all three have to come back as a status,
// or the loop below stops looping. An answer that arrives after the
// deadline is simply ignored; the write is idempotent, so the retry that
// has already gone out does no harm.
const attemptSave = (
  input: { day: DayKey; minutes: number; settled: boolean },
): Promise<SetDayHoursStatus> => new Promise((resolve) => {
  const deadline = setTimeout(() => resolve("unavailable"), HOURS_SAVE_REQUEST_TIMEOUT_MS);

  setDayHours(input)
    .then((answer) => answer.status)
    .catch((): SetDayHoursStatus => "unavailable")
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

  // Three refs, none of which may cause a render: what the screen shows
  // (`target` — the save reads it without subscribing to it), what the
  // server is known to hold, and whether a save is already running.
  const targetRef = useRef(savedMinutes);
  const confirmedRef = useRef(savedMinutes);
  const savingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          showToast({ message: t("saveDayChanged"), tone: "negative" });
          router.refresh();

          return;
        }

        const value = targetRef.current;
        // One value, up to three attempts. Sending the same number again
        // is safe — the write is an upsert keyed by (person, day) — and
        // it is the only honest answer to "we did not hear back", since
        // the row may well have been written and only the reply lost.
        const reaction = await settleSave(value);

        if (reaction.kind === "keep") {
          confirmedRef.current = value;

          continue;
        }

        if (reaction.kind === "unconfirmed") {
          // The number stays. We do not know whether the row was
          // written, and taking it away would be a statement — the one
          // that used to be made here, and that was wrong whenever the
          // write had landed and only the reply was lost. `confirmedRef`
          // is left alone, so the next tap sends the whole value again.
          showToast({ message: t("saveUnconfirmed"), tone: "negative" });

          return;
        }

        // The server answered, and the answer was no. Only the delta it
        // refused comes off: taps made while the request was away were
        // never sent to anybody.
        const next = rollbackTarget(targetRef.current, confirmedRef.current, value);
        const message = reaction.reason === "refused" ? t("saveRefused") : t("saveSignedOut");

        targetRef.current = next;
        setMinutes(next);
        showToast({ message, tone: "negative" });

        return;
      }
    } finally {
      savingRef.current = false;
    }
  }, [day, router, settleSave, t, timeZone]);

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

      // Leaving the screen with a tap still pending: the same loss as
      // above, so the same answer. The request outlives the component —
      // it is a fetch, not a render — and if it fails there is nothing
      // left to roll back or to tell, which is the honest cost of
      // leaving.
      if (timerRef.current) flushNow();
    };
  }, []);

  return { change, minutes };
};
