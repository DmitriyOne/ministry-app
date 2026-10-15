import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";

export type AuthFailure = "invalid-credentials" | "unavailable";

// Which of the two the person is looking at decides where it is shown: a
// credentials problem goes under the field, an unavailable backend goes
// into a toast (ADR 0046). No guessing is needed, Supabase is specific:
// 400 with invalid_credentials for a wrong password, AuthRetryableFetchError
// or a 5xx when it could not be reached.
//
// Anything unrecognised is treated as unavailable rather than as bad
// credentials: telling someone their password is wrong when it is not
// sends them round in circles.
export const classifyAuthError = (error: unknown): AuthFailure => {
  if (error instanceof AuthRetryableFetchError) return "unavailable";

  if (error instanceof AuthApiError && error.status === 400 && error.code === "invalid_credentials") {
    return "invalid-credentials";
  }

  return "unavailable";
};
