"use server";

import { revalidatePath } from "next/cache";

import { monthPath, parseMonthKey } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { createServerSupabaseClient, SUPABASE_QUERY_TIMEOUT_MS } from "@/shared/api";
import { reportActionFailure } from "@/shared/lib/action-failure";

import type { CloseMonthStatus } from "../model/close-month-status";

// close_ministry_month raising on a month that is still being lived.
const CHECK_VIOLATION = "23514";

// The two ways "nobody is signed in" arrives from the database rather
// than from the check above: the function raising on an empty
// auth.uid(), and PostgREST refusing a token that expired on the way.
const NOT_AUTHENTICATED = ["28000", "PGRST301"];

const callMonthFunction = async (
  scope: string,
  fn: "close_ministry_month" | "reopen_ministry_month",
  month: string,
): Promise<{ status: CloseMonthStatus }> => {
  // A Server Action is a public endpoint, reachable by anyone who can
  // craft the request — the third of the three checks every action here
  // has (navigation, data, the form itself).
  if (!await getSessionClaims()) return { status: "signedOut" };

  const key = parseMonthKey(month);

  // Cheap and synchronous, so before the client is built: a malformed
  // month never reaches the database.
  if (!key) return { status: "refused" };

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .rpc(fn, { p_month: key })
      // A deadline, as on every write: a request that hung would leave
      // the screen believing the month had closed.
      .abortSignal(AbortSignal.timeout(SUPABASE_QUERY_TIMEOUT_MS));

    if (error) {
      // A dead session is a normal outcome, not a fault, and is reported
      // nowhere — exactly like the `signedOut` return above.
      if (NOT_AUTHENTICATED.includes(error.code)) return { status: "signedOut" };

      if (error.code === CHECK_VIOLATION) {
        reportActionFailure({ scope, error, outcome: "rejected" });

        return { status: "refused" };
      }

      throw error;
    }

    // The screen this was invoked from is the screen that shows the
    // state, so without this it would go on serving the previous answer
    // from the client cache and the button would not change.
    //
    // Only this address — but the reason is narrower than what stood
    // here, which was that revalidating /day/[day] would evict the
    // client cache of every day screen visited this session. That is
    // not what the runtime does: ANY revalidation inside an action
    // bumps one global version, after which every client-side entry
    // misses with it (invalidateBfCache in
    // client/components/segment-cache/bfcache.js, called from
    // server-action-reducer.js on every outcome but
    // ActionDidNotRevalidate, and again from refresh-reducer.js for the
    // router.refresh() the button does on success). Checked against
    // Next 16.3.5; ADR 0066, decision 9, update 2026-11-02.
    //
    // So the scope buys nothing on the client. What it buys is on the
    // server, where a path is a path and this one is the only path whose
    // data changed.
    //
    // Measured in a browser on 2026-11-05, which the note above was
    // not: a back navigation has two forms, and this covers one. A
    // client-side back goes through the router cache evicted above and
    // comes back correct. A back between two separate documents never
    // asks the server at all, and what stops it serving a stale screen
    // is the response header, not anything here: `next start` sends
    // no-store on a dynamic page, `next dev` only no-cache — which is
    // why the stale lock reproduces on the dev server and not in
    // production. ADR 0066, decision 9, update 2026-11-05.
    revalidatePath(monthPath(key));

    return { status: "success" };
  } catch (error) {
    reportActionFailure({ scope, error, outcome: "failed" });

    return { status: "unavailable" };
  }
};

export const closeMonth = async (
  { month }: { month: string },
): Promise<{ status: CloseMonthStatus }> =>
  callMonthFunction("close-month", "close_ministry_month", month);

export const reopenMonth = async (
  { month }: { month: string },
): Promise<{ status: CloseMonthStatus }> =>
  callMonthFunction("reopen-month", "reopen_ministry_month", month);
