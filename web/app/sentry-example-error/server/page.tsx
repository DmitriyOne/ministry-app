import { notFound } from "next/navigation";

import { SENTRY_PROBE_PREFIX } from "@/pages/sentry-example-error";
import { isDebugPageEnabled } from "@/shared/config";

// Rendered per request: statically, Next would run the throw at build time
// and fail the build.
export const dynamic = "force-dynamic";

// Throws while rendering a Server Component, to check onRequestError.
const SentryExampleErrorServerErrorPage = () => {
  if (!isDebugPageEnabled()) notFound();

  throw new Error(`${SENTRY_PROBE_PREFIX} Server Component render error`);
};

export default SentryExampleErrorServerErrorPage;
