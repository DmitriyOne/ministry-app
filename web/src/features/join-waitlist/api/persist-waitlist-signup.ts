import "server-only";

import { createAdminSupabaseClient } from "@/shared/api";
import { reportActionFailure } from "@/shared/lib/action-failure";

import type { JoinWaitlistRow } from "../model/map-join-waitlist-row";

// The single point where a waitlist address is stored. Until ADR 0033 this
// was a console.info with the address in it (ADR 0027); it is now one call
// to public.join_waitlist, the only path into a table no PostgREST role
// can reach directly. The signature is deliberately the same shape ADR
// 0022 anticipated: the caller hands over an address and gets back a
// result, and knows nothing about Supabase.
//
// Called with the secret key (ADR 0037): anon can no longer execute the
// function at all. The rate limiter in the calling server action is
// therefore the only thing standing between the public and this write; the
// database no longer rate-limits anything itself.
export const persistWaitlistSignup = async (email: string): Promise<JoinWaitlistRow | null> => {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc("join_waitlist", { p_email: email }).single();

  if (error) {
    // `code` and `message` only — deliberately not `details` or `hint`.
    // Postgres quotes the offending value in the detail line of a
    // constraint violation ("Key (email)=(someone@example.com) already
    // exists"), which would put the address straight back into the logs
    // this change exists to get it out of (ADR 0027), while `message`
    // names the constraint without the value. Same rule as the visitor's
    // IP in ADR 0026: the fact, never the value.
    // Reported, not only logged. supabase-js returns `error` instead of
    // throwing, so nothing above catches this, and the person has already
    // been shown a success screen — the address is gone and the only
    // trace was a log line nobody reads. scrubSentryEvent strips the
    // address from the text on the way out (ADR 0041), including the
    // detail line where Postgres quotes the offending value.
    reportActionFailure({
      scope: "join-waitlist",
      error,
      outcome: "failed",
      context: { reason: "supabase-error", code: error.code },
    });
    console.error("[join-waitlist] could not record the signup", {
      code: error.code,
      message: error.message,
    });

    return null;
  }

  return data;
};
