import * as Sentry from "@sentry/nextjs";

// Loads the matching Sentry config for the runtime Next.js is starting.
export const register = async () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
};

// Captures errors thrown in Server Components, Server Actions and the proxy.
export const onRequestError = Sentry.captureRequestError;
