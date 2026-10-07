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
  const withinRateLimit = checkRequestPasswordResetRateLimit(ip).success;

  const result = createRequestPasswordResetSchema(t).safeParse(values);

  if (!result.success) {
    // A malformed address says nothing about who has an account, so this
    // one case may answer honestly — and has to, or a typo would look like
    // a request that went through.
    const { email } = z.flattenError(result.error).fieldErrors;

    return { status: "error", fieldErrors: { email: email?.[0] } };
  }

  if (withinRateLimit) {
    // No mail is sent yet (that waits for a mail sender), so this log IS
    // the working mechanism: the owner sees the request and sets a new
    // password in Studio. The address in plaintext is the same temporary
    // trade-off ADR 0027 accepted for waitlist addresses, and it retires
    // the same way — once mail goes out, this drops to the fact without
    // the address.
    console.info("[request-password-reset] reset requested", { email: result.data.email });
  } else {
    // Over the limit: the request is dropped rather than answered
    // differently. Nothing identifying goes into this line — the point is
    // only that the drop is visible to the owner at all.
    console.warn("[request-password-reset] rejected", { reason: "rate-limit" });
  }

  // One answer, always. Not whether the address has an account, not
  // whether the limiter let it through: either would turn this page into a
  // way of finding out who has an account here. Which is also why no
  // account lookup happens above — there would be nothing to do with the
  // answer that does not break this.
  return { status: "success" };
};
