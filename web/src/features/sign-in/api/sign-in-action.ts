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
  // allows exactly this row. A failed read must not undo a sign-in that
  // already succeeded, so the name is simply left out.
  const { data: profile } = await supabase.from("profiles").select("display_name").maybeSingle();

  return { status: "success", displayName: profile?.display_name };
};
