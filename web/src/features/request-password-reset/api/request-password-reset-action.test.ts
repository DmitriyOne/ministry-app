import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ALLOWED_EMAIL_DOMAIN } from "@/shared/lib/email";

// Three stand-ins, none of which carry behaviour this test is about:
// server-only is a build-time marker that throws outside a server
// component, headers() needs a request, and the translator is replaced by
// the identity on the key so an assertion names the rule that fired rather
// than a sentence that will be reworded.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: () => new Headers({ "x-vercel-forwarded-for": "203.0.113.7" }),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

import { requestPasswordReset } from "./request-password-reset-action";
import { requestPasswordResetInitialState } from "../model/schema";

const EMAIL = `ruth@${ALLOWED_EMAIL_DOMAIN}`;

const submit = (email: string) => requestPasswordReset(requestPasswordResetInitialState, { email });

beforeEach(() => {
  // The action logs on both paths; the test is about what it returns.
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requestPasswordReset", () => {
  it("answers a rate-limited request exactly as it answers a successful one", async () => {
    // The limiter allows three per hour per IP and this module holds one
    // instance for the whole test file, so the fourth submission is the
    // rejected one. It must be indistinguishable from the first, or the
    // page becomes a way to probe which addresses have accounts and how
    // the limiter is configured.
    const first = await submit(EMAIL);

    await submit(EMAIL);
    await submit(EMAIL);

    const limited = await submit(EMAIL);

    expect(first).toEqual({ status: "success" });
    expect(limited).toEqual(first);
  });

  it("answers an address that has no account the same way", async () => {
    // Nothing in the action looks an account up, which is what makes this
    // hold; the assertion is here so that adding a lookup breaks a test.
    expect(await submit(`nobody@${ALLOWED_EMAIL_DOMAIN}`)).toEqual({ status: "success" });
  });

  it("rejects an address that could not belong to an account", async () => {
    // A malformed or foreign address is about the input, not about who has
    // an account, so this is the one case that may answer differently.
    expect(await submit("ruth@example.com")).toEqual({
      status: "error",
      fieldErrors: { email: "emailInvalid" },
    });
  });
});
