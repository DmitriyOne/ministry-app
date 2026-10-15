"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { reportActionFailure } from "@/shared/lib/action-failure";
import { getClientIp } from "@/shared/lib/rate-limit";

import { persistWaitlistSignup } from "./persist-waitlist-signup";
import { checkJoinWaitlistRateLimit } from "./rate-limit";
import { mapJoinWaitlistRow } from "../model/map-join-waitlist-row";
import {
  createJoinWaitlistSchema,
  type JoinWaitlistActionState,
  type JoinWaitlistSubmission,
} from "../model/schema";

export const joinWaitlist = async (
  _previousState: JoinWaitlistActionState,
  values: JoinWaitlistSubmission,
): Promise<JoinWaitlistActionState> => {
  const t = await getTranslations("screens.comingSoon");

  // Checked before anything else, same order as the rate limiter below:
  // a filled-in honeypot means a bot, and a bot gets exactly the response
  // a real successful submission would get — no field error, no "too many
  // requests", nothing that would help it learn it was caught.
  if (values.honeypot) {
    return { status: "success" };
  }

  // The client IP is only ever used as an in-memory rate-limit key here —
  // never logged or persisted (it's personal data). See
  // shared/lib/rate-limit/get-client-ip.ts for why this specific header.
  const ip = getClientIp(await headers());
  const rateLimit = checkJoinWaitlistRateLimit(ip);

  if (!rateLimit.success) {
    console.warn("[join-waitlist] rate limit exceeded", { scope: rateLimit.scope });
    return { status: "error", formError: t("tooManyRequests") };
  }

  const schema = createJoinWaitlistSchema(t);
  const result = schema.safeParse(values);

  if (!result.success) {
    // ZodError.flatten() is deprecated in zod 4 in favour of the standalone
    // z.flattenError() (see context7/colinhacks/zod).
    const emailError = z.flattenError(result.error).fieldErrors.email?.[0];
    return { status: "error", fieldErrors: { email: emailError } };
  }

  try {
    const row = await persistWaitlistSignup(result.data.email);

    // The fact, never the address — the condition ADR 0027 set for
    // retiring the plaintext log, and the same rule ADR 0026 already
    // applies to the visitor's IP.
    if (row) {
      console.info("[join-waitlist] signup recorded", { alreadyJoined: row.already_joined });
    }

    return mapJoinWaitlistRow(row, t("submitError"));
  } catch (error) {
    // This used to be a bare `catch {}` with nothing but the message to
    // the person: a failing sign-up left no trace in the log or in
    // Sentry, so "the form is broken" could only ever be reported by
    // whoever hit it. The person still sees the same text.
    reportActionFailure({ scope: "join-waitlist", error });

    return { status: "error", formError: t("submitError") };
  }
};
