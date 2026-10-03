import { notFound } from "next/navigation";

import { SentryExampleErrorScreen } from "@/pages/sentry-example-error";
import { isDebugPageEnabled } from "@/shared/config";

export { generateMetadata } from "@/pages/sentry-example-error";

// Debug page: a real 404 in production (see isDebugPageEnabled).
const SentryExampleErrorPage = () => {
  if (!isDebugPageEnabled()) notFound();

  return <SentryExampleErrorScreen />;
};

export default SentryExampleErrorPage;
