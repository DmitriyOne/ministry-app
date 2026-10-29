"use server";

import { revalidatePath } from "next/cache";

import { monthPath, parseMonthKey } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { createServerSupabaseClient, SUPABASE_QUERY_TIMEOUT_MS } from "@/shared/api";
import { reportActionFailure } from "@/shared/lib/action-failure";

import type { CloseMonthStatus } from "../model/close-month-status";

// set_ministry_month_closed raising on a month that is still being lived.
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
    // Only this address. The days of the month are a separate family
    // (/day/[day]) and revalidating it would evict the client cache of
    // every day screen visited this session — the flicker ADR 0057
    // already paid for once. A day page opened before the month closed
    // learns about the lock on its next read, and until then the
    // database refuses the write anyway, which is where the lock really
    // lives.
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
