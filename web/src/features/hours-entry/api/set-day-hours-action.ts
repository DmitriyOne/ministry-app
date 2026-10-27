"use server";

import { revalidatePath } from "next/cache";

import { dayPath, parseDayKey } from "@/entities/ministry-day";
import { getSessionClaims } from "@/entities/session";
import { createServerSupabaseClient, SUPABASE_QUERY_TIMEOUT_MS } from "@/shared/api";
import { reportActionFailure } from "@/shared/lib/action-failure";

import { classifySaveFailure, type SetDayHoursStatus } from "../model/hours-save";
import { MAX_DAY_MINUTES } from "../model/hours-value";

// A check constraint or a raise from set_ministry_day_minutes: the day
// has not happened yet, or the minutes do not fit in a day. Those are
// refusals, not outages, and must not be reported as "the server did not
// answer" — the card rolls back either way, but what it says differs
// (ADR 0046).
const CHECK_VIOLATION = "23514";

// The two ways "nobody is signed in" reaches us from the database rather
// than from our own check above. `28000` is set_ministry_day_minutes
// raising on an empty auth.uid(); `PGRST301` is PostgREST refusing an
// expired or unverifiable JWT (HTTP 401). Both are reachable in one
// ordinary situation: getSessionClaims checked a token that was still
// alive and it expired on the way to the database. Classified, because
// the alternative told the person "couldn't reach the server" — advice
// that leads nowhere — and filed the outage in Sentry as an exception.
const NOT_AUTHENTICATED = ["28000", "PGRST301"];

// Called on every tap, debounced by the hook. No zod schema and no field
// errors: there are two values, neither of them typed by hand, so there
// is nothing to put under a field — the whole answer is "saved" or "not
// saved", and which kind of "not".
export const setDayHours = async (
  { day, minutes, settled }: { day: string; minutes: number; settled: boolean },
): Promise<{ status: SetDayHoursStatus }> => {
  // The screen is already behind a session (proxy.ts) and the database
  // would refuse an anonymous write anyway — set_ministry_day_minutes
  // raises without auth.uid(). This is the third of those three checks,
  // here for the reason every action has it: a Server Action is a public
  // endpoint, reachable by anyone who can craft the request.
  //
  // Its own status, rather than "refused": a session that died while the
  // screen was open is the likeliest way to get here, and "check the
  // date on your phone" would be a lie about it.
  const claims = await getSessionClaims();

  if (!claims) return { status: "signedOut" };

  const dayKey = parseDayKey(day);

  // Cheap and synchronous, so before the client is built: a malformed
  // day or an impossible number never reaches the database.
  if (!dayKey) return { status: "refused" };

  if (!Number.isInteger(minutes) || minutes < 0 || minutes > MAX_DAY_MINUTES) {
    return { status: "refused" };
  }

  try {
    // A deadline here too, and this write needs it more than a read
    // does: `.rpc()` is a POST, which supabase-js deliberately does not
    // retry, and a request that hangs would leave the card believing it
    // had saved — the rollback and its toast only exist if the request
    // can actually fail.
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .rpc("set_ministry_day_minutes", { p_day: dayKey, p_minutes: minutes })
      .abortSignal(AbortSignal.timeout(SUPABASE_QUERY_TIMEOUT_MS));

    if (error) {
      // A refusal from the database is a fact about the request; an
      // outage is a fact about us. Anything we cannot classify is
      // reported as an outage, because that is the honest answer when we
      // do not know.
      // A dead session is a normal outcome, not a fault: reported
      // nowhere, exactly like the `!claims` return above it.
      if (NOT_AUTHENTICATED.includes(error.code)) return { status: "signedOut" };

      if (error.code === CHECK_VIOLATION) {
        reportActionFailure({ scope: "set-day-hours", error, outcome: "rejected" });

        return { status: "refused" };
      }

      throw error;
    }

    // The screen this was invoked from is the screen that renders the
    // number, so without this it would keep serving the previous one
    // from the client cache: leave /day, come back, and the card opens
    // at what the server said LAST time — at which point a tap saves a
    // total built on a stale number and the difference is gone for good.
    // That is the "another screen must change" rule (CLAUDE.md) applied
    // to the screen you are standing on, and it is data rather than
    // looks, so it is worth the cost named there — the route's client
    // cache is evicted.
    //
    // Only for the save the card has settled on, though. Revalidating
    // re-runs the whole of readDayPage — two more database round trips —
    // and doing that for an intermediate value in a burst buys nothing:
    // another save is already queued behind it and will revalidate in
    // its turn. The hook says which one that is.
    //
    // No flicker to pay for: the card holds its own number and is keyed
    // by the day, so re-rendering the server part around it changes
    // nothing on screen. What it does do is keep the totals honest once
    // the progress block reads them.
    if (settled) revalidatePath(dayPath(dayKey));

    return { status: "success" };
  } catch (error) {
    // Two answers, not one. A connection the database refused means
    // nothing was written and the card may take the number back; a
    // deadline or a reply lost on the way means we do not know, and the
    // card keeps it (ADR 0062, the 2026-10-27 update). The server is the only place
    // that can tell these apart — from the browser both look like "no
    // answer" — which is why the classification lives on this side of
    // the call.
    const status = classifySaveFailure(error);

    // Reported either way: on this project an unreachable database is a
    // fact worth a page in Sentry, whatever the card does about it. The
    // classification travels with it — which of the two it was is the
    // first question anybody reading the line will have.
    reportActionFailure({
      scope: "set-day-hours",
      error,
      outcome: "failed",
      context: { status },
    });

    return { status };
  }
};
