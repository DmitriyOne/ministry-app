"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import * as Sentry from "@sentry/nextjs";

import { createServerSupabaseClient } from "@/shared/api";
import { redactEmails } from "@/shared/lib/observability";
import { getClientIp } from "@/shared/lib/rate-limit";

import { checkSignInRateLimit, recordSignInFailure } from "./rate-limit";
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
  // Which step threw, so the log says more than "something did". Three
  // things in here can fail for unrelated reasons and the difference matters
  // when reading a log: the cookie store, the auth call, the profile read.
  let stage: "client" | "sign-in" | "profile" = "client";

  try {
    const supabase = await createServerSupabaseClient();

    stage = "sign-in";
    const { error } = await supabase.auth.signInWithPassword(result.data);

    if (error) {
      const failure = classifyAuthError(error);

      // Only the fact, never the address (ADR 0026/0027).
      console.warn("[sign-in] rejected", { reason: failure });

      // A backend that did not answer is not a guess, so it does not
      // spend the attempt budget.
      if (failure === "unavailable") return { status: "unavailable" };

      // This one is a rejected password: the only thing the limiter counts.
      recordSignInFailure(ip);

      // One text for both fields: saying which of the two was wrong would
      // turn the form into a check for whether an account exists.
      return { status: "error", formError: t("invalidCredentials") };
    }

    // Read under the person's own session; the "read own profile" policy
    // allows exactly this row, so no id filter is needed. A failed read must
    // not undo a sign-in that already succeeded, so the name is simply left
    // out. displayName is carried for the welcome toast (task 10) and has no
    // consumer yet.
    stage = "profile";

    const { data: profile } = await supabase.from("profiles").select("display_name").maybeSingle();

    return { status: "success", displayName: profile?.display_name };
  } catch (error) {
    // Two destinations on purpose. Sentry gets the whole exception, stack
    // included, and beforeSend runs it through scrubSentryEvent, so an
    // address quoted inside a message never leaves the process (ADR 0041).
    // The server log gets what can be read at a glance and carries no
    // personal data: which step threw, the error's class, and its message
    // with addresses redacted by the same rule the scrubber uses.
    //
    // Sentry is off outside production (ADR 0041, update), so in development
    // the log below is all there is — which is why it carries the message
    // rather than only the class.
    Sentry.captureException(error);

    console.warn("[sign-in] rejected", {
      reason: "threw",
      stage,
      error: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? redactEmails(error.message) : undefined,
    });

    return { status: "unavailable" };
  }
};
