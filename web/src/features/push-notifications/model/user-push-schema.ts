import { z } from "zod";

import { isPushServiceEndpoint } from "./push-service-hosts";

// The same shape the waitlist registration validates, minus the one-time
// token: here the caller is identified by their session, not by a
// capability. isPushServiceEndpoint keeps the endpoint to the known push
// services, so this cannot be used to point our sender at an arbitrary URL.
export const enableUserPushSchema = z.object({
  endpoint: z.url().max(4096).refine(isPushServiceEndpoint),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export const disableUserPushSchema = z.object({
  endpoint: z.url().max(4096).refine(isPushServiceEndpoint),
});

export type UserPushResult = { status: "success" } | { status: "error" };
