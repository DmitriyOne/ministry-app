"use server";

import { isDebugPageEnabled } from "@/shared/config";

import { SENTRY_PROBE_PREFIX } from "../model/probe";

// Throws on purpose, so the failure reaches Sentry through onRequestError
// (instrumentation.ts). Guarded again here: a Server Action stays callable
// by id even when the page itself returns 404.
export const throwServerError = async (): Promise<void> => {
  if (!isDebugPageEnabled()) return;

  throw new Error(`${SENTRY_PROBE_PREFIX} Server Action error`);
};
