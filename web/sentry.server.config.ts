import * as Sentry from "@sentry/nextjs";

import { env } from "@/shared/config";
import { scrubSentryEvent } from "@/shared/lib/observability";

Sentry.init({
  // Public by design: a DSN only lets a sender submit events.
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  // Without a DSN the SDK stays off, so local development and builds
  // without Sentry behave exactly as they did before.
  enabled: Boolean(env.NEXT_PUBLIC_SENTRY_DSN),
  // Errors only. Performance tracing is switched off explicitly rather
  // than left to a default that may change.
  tracesSampleRate: 0,
  // Keeps request identity and incidental data out of events. SDK v11
  // replaced `sendDefaultPii` with `dataCollection`, whose defaults collect
  // everything, so each source is switched off explicitly: user info (which
  // is where IP addresses come from), cookies, headers, bodies, query
  // strings, and local variables in stack frames (they could hold an email
  // address). The privacy notice says IP collection is disabled, so none of
  // this may be loosened without updating it.
  dataCollection: {
    userInfo: false,
    // No AI integrations here today, but the defaults are permissive and
    // Sentry's own conservative baseline lists this category, so it is
    // switched off now rather than discovered later.
    genAI: { inputs: false, outputs: false },
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    queues: false,
    stackFrameVariables: false,
  },
  // Last line of defence: strips email addresses from error text and
  // secret-like keys from attached context before anything is sent.
  beforeSend: (event) => scrubSentryEvent(event),
  // No replayIntegration or feedbackIntegration on purpose: Session Replay
  // would record what people see and type, which would make the privacy
  // notice's "no analytics or tracking tools" statement false. Leaving
  // them out also keeps that code out of the bundle.
});
