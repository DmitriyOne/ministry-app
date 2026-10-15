"use server";

import { env, isDebugPageEnabled } from "@/shared/config";

export type BackendProbeResult = {
  status: "ok" | "unavailable";
};

// Asks Supabase for its health endpoint with a timeout too short for any
// answer to arrive, so the failure is a genuine "the backend did not
// respond" rather than a pretend one: the same class of error a real outage
// produces, reached without stopping anything.
//
// It returns a state instead of throwing, which is the contract every
// server action in v2 follows (ADR 0046): a backend that did not answer is
// an expected outcome the UI reports with a toast, not an exception that
// lands on the 500 screen.
//
// Guarded again here: a Server Action stays callable by its id even when the
// page itself returns 404 in production.
export const probeBackendFailure = async (): Promise<BackendProbeResult> => {
  if (!isDebugPageEnabled()) return { status: "ok" };

  try {
    await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      signal: AbortSignal.timeout(1),
      cache: "no-store",
    });

    return { status: "ok" };
  } catch {
    return { status: "unavailable" };
  }
};
