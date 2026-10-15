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
  it("answers an address that has no account exactly as it answers one that has", async () => {
    // The property that must hold whatever else changes: nothing in the
    // action looks an account up, so it cannot answer differently. The
    // assertion is here so that adding a lookup breaks a test.
    const first = await submit(EMAIL);

    expect(first).toEqual({ status: "success" });
    expect(await submit(`nobody@${ALLOWED_EMAIL_DOMAIN}`)).toEqual(first);
  });

  it("rejects an address that could not belong to an account", async () => {
    // A malformed or foreign address is about the input, not about who has
    // an account, so it may answer differently.
    expect(await submit("ruth@example.com")).toEqual({
      status: "error",
      fieldErrors: { email: "emailInvalid" },
    });
  });

  it("says so when the limit is reached", async () => {
    // Three per hour per IP, and this module holds one limiter instance
    // for the whole file: the two tests above spend all three (the
    // malformed address counts too — the limiter is checked before the
    // schema), so this is the fourth and is rejected. Deliberately NOT a
    // neutral answer: the owner chose the same message the sign-in form
    // and the waitlist give, over leaving someone with a form that
    // silently stopped working (ADR 0043, update).
    expect(await submit(EMAIL)).toEqual({ status: "error", formError: "tooManyRequests" });
  });
});
