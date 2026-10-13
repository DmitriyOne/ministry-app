"use server";

import { headers } from "next/headers";

import { getSessionClaims } from "@/entities/session";
import { createAdminSupabaseClient } from "@/shared/api";
import { reportActionFailure } from "@/shared/lib/action-failure";
import { getClientIp } from "@/shared/lib/rate-limit";

import { checkPushRegistrationRateLimit } from "./rate-limit";
import { enableUserPushSchema, type UserPushResult } from "../model/user-push-schema";

// Links this browser's subscription to the person who is signed in.
//
// Called on two occasions, and it has to be the same call for both: when
// the switch is turned on, and when the screen opens and finds a
// subscription that this account has not claimed yet — someone who said
// yes from the waitlist and later got an account is the same device. The
// RPC is an upsert on the endpoint, so saying it twice is free.
export const enableUserPush = async (input: unknown): Promise<UserPushResult> => {
  const claims = await getSessionClaims();

  // A Server Action is a public endpoint, whatever screen it is reached
  // from (ADR 0045). Without a session there is nobody to attach a
  // subscription to.
  if (!claims) {
    console.warn("[push] rejected", { reason: "no-session" });

    return { status: "error" };
  }

  const ip = getClientIp(await headers());
  const rateLimit = checkPushRegistrationRateLimit(ip);

  if (!rateLimit.success) {
    console.warn("[push] rate limit exceeded", { scope: rateLimit.scope });

    return { status: "error" };
  }

  const parsed = enableUserPushSchema.safeParse(input);

  if (!parsed.success) return { status: "error" };

  try {
    // Secret-key client (ADR 0037): the table is closed, and the function
    // is executable by service_role only. The authorisation this client
    // does not do is the session check above — the user id comes from the
    // verified token, never from the request body.
    const { data, error } = await createAdminSupabaseClient().rpc(
      "register_user_push_subscription",
      {
        p_user_id: claims.userId,
        p_endpoint: parsed.data.endpoint,
        p_p256dh: parsed.data.keys.p256dh,
        p_auth: parsed.data.keys.auth,
      },
    );

    if (error || data !== true) {
      console.warn("[push] could not register subscription", { code: error?.code });

      return { status: "error" };
    }

    return { status: "success" };
  } catch (error) {
    reportActionFailure({ scope: "push", error });

    return { status: "error" };
  }
};
