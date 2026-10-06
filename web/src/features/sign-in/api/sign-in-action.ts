"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/shared/api";
import { getClientIp } from "@/shared/lib/rate-limit";

import { checkSignInRateLimit } from "./rate-limit";
import { classifyAuthError } from "../model/classify-auth-error";
import { createSignInSchema, type SignInActionState, type SignInFormValues } from "../model/schema";

export const signIn = async (
  _previousState: SignInActionState,
  values: SignInFormValues,
): Promise<SignInActionState> => {
  const t = await getTranslations("screens.login");

  // The IP is only ever a rate-limit key: never logged or persisted.
  const ip = getClientIp(await headers());

  if (!checkSignInRateLimit(ip).success) {
    console.warn("[sign-in] rejected", { reason: "rate-limit" });
    return { status: "error", formError: t("tooManyRequests") };
  }

  const result = createSignInSchema(t).safeParse(values);

  if (!result.success) {
    const { email, password } = z.flattenError(result.error).fieldErrors;

    return { status: "error", fieldErrors: { email: email?.[0], password: password?.[0] } };
  }

  // Everything that talks to Supabase sits inside this try. signInWithPassword
  // itself catches its own failures and hands them back as `error` — verified
  // in the SDK source — but anything that is not an AuthError is rethrown, and
  // creating the client or reading the profile can throw outright. A server
  // action that throws reaches app/error.tsx, i.e. the 500 screen, and ADR 0046
  // is explicit that a backend which did not answer belongs in a toast instead.
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword(result.data);

    if (error) {
      const failure = classifyAuthError(error);

      // Only the fact, never the address (ADR 0026/0027).
      console.warn("[sign-in] rejected", { reason: failure });

      if (failure === "unavailable") return { status: "unavailable" };

      // One text for both fields: saying which of the two was wrong would
      // turn the form into a check for whether an account exists.
      return { status: "error", formError: t("invalidCredentials") };
    }

    // Read under the person's own session; the "read own profile" policy
    // allows exactly this row, so no id filter is needed. A failed read must
    // not undo a sign-in that already succeeded, so the name is simply left
    // out. displayName is carried for the welcome toast (task 10) and has no
    // consumer yet.
    const { data: profile } = await supabase.from("profiles").select("display_name").maybeSingle();

    return { status: "success", displayName: profile?.display_name };
  } catch {
    console.warn("[sign-in] rejected", { reason: "threw" });

    return { status: "unavailable" };
  }
};
