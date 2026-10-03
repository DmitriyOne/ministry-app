import { z } from "zod";

import { isPushServiceEndpoint } from "./push-service-hosts";

export const registerPushSubscriptionSchema = z.object({
  enrollmentToken: z.uuid(),
  subscription: z.object({
    endpoint: z.url().max(4096).refine(isPushServiceEndpoint),
    keys: z.object({
      p256dh: z.string().min(1).max(512),
      auth: z.string().min(1).max(512),
    }),
  }),
});

export type RegisterPushSubscriptionResult
  = | { status: "success" }
    | { status: "error" };
