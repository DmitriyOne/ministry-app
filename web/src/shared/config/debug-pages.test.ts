import { afterEach, describe, expect, it, vi } from "vitest";

import { isDebugPageEnabled } from "./debug-pages";

describe("isDebugPageEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is enabled when VERCEL_ENV is not set (local development)", () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    expect(isDebugPageEnabled()).toBe(true);
  });

  it("is enabled on Vercel preview deployments", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isDebugPageEnabled()).toBe(true);
  });

  it("is enabled on Vercel development", () => {
    vi.stubEnv("VERCEL_ENV", "development");
    expect(isDebugPageEnabled()).toBe(true);
  });

  it("is disabled on Vercel production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isDebugPageEnabled()).toBe(false);
  });
});
