"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { getClientIp } from "@/shared/lib/rate-limit";

import { checkJoinWaitlistRateLimit } from "./rate-limit";
import {
  createJoinWaitlistSchema,
  type JoinWaitlistActionState,
  type JoinWaitlistSubmission,
} from "../model/schema";

// There's no waitlist table in Supabase yet (migrations live as files in
// backend/supabase/migrations/ — separate task). For now the only
// persistence point is a structured entry in the server log (visible in
// `pnpm dev` and in Vercel logs): not a fake write or a placeholder for
// later, but a real, immediately-executing side effect that doesn't lose
// the submitted email, and that changes to a single insert once the
// table exists. The risk this carries is recorded in ADR 0027.
const persistWaitlistSignup = async (email: string) => {
  console.info("[join-waitlist] new signup", { email });
};

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
    await persistWaitlistSignup(result.data.email);
    return { status: "success" };
  } catch {
    return { status: "error", formError: t("submitError") };
  }
};
