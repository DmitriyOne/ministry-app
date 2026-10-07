"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { getClientIp } from "@/shared/lib/rate-limit";

import { checkRequestPasswordResetRateLimit } from "./rate-limit";
import {
  createRequestPasswordResetSchema,
  type RequestPasswordResetActionState,
  type RequestPasswordResetFormValues,
} from "../model/schema";

export const requestPasswordReset = async (
  _previousState: RequestPasswordResetActionState,
  values: RequestPasswordResetFormValues,
): Promise<RequestPasswordResetActionState> => {
  const t = await getTranslations("screens.forgotPassword");

  // The IP is only ever a rate-limit key: never logged or persisted.
  const ip = getClientIp(await headers());

  // Over the limit, the person is told so — the same message, in the same
  // place, as on the sign-in form and the waitlist (ADR 0043, update).
  // This is a deliberate choice against hiding it: a uniform answer would
  // reveal nothing about how the limiter is set, but it would also leave
  // someone staring at a form that silently stopped working. Consistency
  // across the three forms won. It does not touch the other kind of
  // neutrality: the answer still never depends on whether the address has
  // an account.
  if (!checkRequestPasswordResetRateLimit(ip).success) {
    console.warn("[request-password-reset] rejected", { reason: "rate-limit" });

    return { status: "error", formError: t("tooManyRequests") };
  }

  const result = createRequestPasswordResetSchema(t).safeParse(values);

  if (!result.success) {
    // A malformed address says nothing about who has an account, so this
    // one case may answer honestly — and has to, or a typo would look like
    // a request that went through.
    const { email } = z.flattenError(result.error).fieldErrors;

    return { status: "error", fieldErrors: { email: email?.[0] } };
  }

  // No mail is sent yet (that waits for a mail sender), so this log IS the
  // working mechanism: the owner sees the request and sets a new password
  // in Studio. The address in plaintext is the same temporary trade-off
  // ADR 0027 accepted for waitlist addresses, and it retires the same way
  // — once mail goes out, this drops to the fact without the address.
  console.info("[request-password-reset] reset requested", { email: result.data.email });

  // The same answer whether or not that address has an account. This is
  // also why no account lookup happens above: there would be nothing to do
  // with the answer that does not turn this page into a way of finding out
  // who has an account here.
  return { status: "success" };
};
