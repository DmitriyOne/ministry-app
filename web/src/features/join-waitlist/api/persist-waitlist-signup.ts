import "server-only";

import { createServerSupabaseClient } from "@/shared/api";

import type { JoinWaitlistRow } from "../model/map-join-waitlist-row";

// The single point where a waitlist address is stored. Until ADR 0033 this
// was a console.info with the address in it (ADR 0027); it is now one call
// to public.join_waitlist, the only path into a table no PostgREST role
// can reach directly. The signature is deliberately the same shape ADR
// 0022 anticipated: the caller hands over an address and gets back a
// result, and knows nothing about Supabase.
export const persistWaitlistSignup = async (email: string): Promise<JoinWaitlistRow | null> => {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("join_waitlist", { p_email: email }).single();

  if (error) {
    // `code` and `message` only — deliberately not `details` or `hint`.
    // Postgres quotes the offending value in the detail line of a
    // constraint violation ("Key (email)=(someone@example.com) already
    // exists"), which would put the address straight back into the logs
    // this change exists to get it out of (ADR 0027), while `message`
    // names the constraint without the value. Same rule as the visitor's
    // IP in ADR 0026: the fact, never the value.
    console.error("[join-waitlist] could not record the signup", {
      code: error.code,
      message: error.message,
    });

    return null;
  }

  return data;
};
