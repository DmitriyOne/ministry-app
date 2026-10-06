import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { classifyAuthError } from "./classify-auth-error";

describe("classifyAuthError", () => {
  // Wrong password is about the person's input, so it belongs under the
  // field, never in a toast.
  it("treats invalid credentials as a credentials problem", () => {
    const error = new AuthApiError("Invalid login credentials", 400, "invalid_credentials");

    expect(classifyAuthError(error)).toBe("invalid-credentials");
  });

  // Supabase being unreachable is not the person's fault and must not read
  // as "wrong password" (ADR 0046).
  it("treats a retryable fetch failure as the backend being unavailable", () => {
    const error = new AuthRetryableFetchError("Failed to fetch", 0);

    expect(classifyAuthError(error)).toBe("unavailable");
  });

  it("treats a server-side error as the backend being unavailable", () => {
    const error = new AuthApiError("Internal Server Error", 500, undefined);

    expect(classifyAuthError(error)).toBe("unavailable");
  });

  it("treats anything unrecognised as unavailable, not as bad credentials", () => {
    expect(classifyAuthError(new Error("boom"))).toBe("unavailable");
  });
});
