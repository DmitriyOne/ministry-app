import type { Event } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "./scrub-sentry-event";

describe("scrubSentryEvent", () => {
  it("redacts an address in the message", () => {
    const result = scrubSentryEvent({ message: "Failed for jane.doe@gmail.com today" });

    expect(result.message).toBe("Failed for [redacted] today");
  });

  it("redacts an address in an exception value", () => {
    const result = scrubSentryEvent({
      exception: { values: [{ type: "Error", value: "duplicate key (a+b@mail.co.uk)" }] },
    });

    expect(result.exception?.values?.[0]?.value).toBe("duplicate key ([redacted])");
    expect(result.exception?.values?.[0]?.type).toBe("Error");
  });

  it("redacts an address in a breadcrumb message", () => {
    const result = scrubSentryEvent({
      breadcrumbs: [{ message: "submit x@y.org", category: "ui" }],
    });

    expect(result.breadcrumbs?.[0]?.message).toBe("submit [redacted]");
    expect(result.breadcrumbs?.[0]?.category).toBe("ui");
  });

  it("redacts the email key in extra", () => {
    const result = scrubSentryEvent({ extra: { email: "a@b.com", step: 2 } });

    expect(result.extra).toEqual({ email: "[redacted]", step: 2 });
  });

  it.each(["token", "TOKEN", "Token", "enrollmentToken", "Authorization", "apiKey", "P256DH"])(
    "redacts the key %s regardless of case",
    (key) => {
      const result = scrubSentryEvent({ extra: { [key]: "abc123" } });

      expect(result.extra).toEqual({ [key]: "[redacted]" });
    },
  );

  it("does not fail on an event without any of the scrubbed fields", () => {
    expect(scrubSentryEvent({})).toEqual({});
    expect(scrubSentryEvent({ level: "error" })).toEqual({ level: "error" });
  });

  it("redacts nested keys and nested strings", () => {
    const result = scrubSentryEvent({
      contexts: { push: { subscription: { endpoint: "https://x", auth: "k", note: "me@a.io" } } },
    });

    expect(result.contexts).toEqual({
      push: { subscription: { endpoint: "[redacted]", auth: "[redacted]", note: "[redacted]" } },
    });
  });

  it("does not mutate its argument", () => {
    const event: Event = {
      message: "a@b.com",
      exception: { values: [{ value: "a@b.com" }] },
      breadcrumbs: [{ message: "a@b.com" }],
      extra: { email: "a@b.com", nested: { password: "p" } },
    };
    const snapshot = structuredClone(event);

    scrubSentryEvent(event);

    expect(event).toEqual(snapshot);
  });

  it("survives malformed and circular input", () => {
    const loop: Record<string, unknown> = { a: 1 };
    loop.self = loop;
    const weird = {
      message: 42,
      exception: { values: "nope" },
      breadcrumbs: [null, 1],
      extra: loop,
    } as unknown as Event;

    expect(() => scrubSentryEvent(weird)).not.toThrow();
    expect(scrubSentryEvent(weird)).toBeTruthy();
  });
});
