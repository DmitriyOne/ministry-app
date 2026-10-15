import { afterEach, describe, expect, it, vi } from "vitest";

// The module is server-only, which throws when imported outside a server
// component; the marker carries no behaviour of its own, so it is stubbed.
vi.mock("server-only", () => ({}));

import { createSlidingWindowLimiter } from "./sliding-window";

// Only Date is faked: the limiter's own cleanup timer is unref'd and
// irrelevant here, and faking setInterval as well would mean driving it by
// hand for no gain.
const WINDOW_MS = 15 * 60 * 1000;

const createLimiter = () => createSlidingWindowLimiter({ limit: 3, windowMs: WINDOW_MS });

afterEach(() => {
  vi.useRealTimers();
});

describe("createSlidingWindowLimiter", () => {
  it("blocks once the limit is reached", () => {
    const limiter = createLimiter();

    expect(limiter("key").remaining).toBe(2);
    expect(limiter("key").remaining).toBe(1);
    expect(limiter("key").remaining).toBe(0);
    expect(limiter("key").success).toBe(false);
  });

  it("counts each key separately", () => {
    const limiter = createLimiter();

    limiter("one");
    limiter("one");
    limiter("one");

    expect(limiter("one").success).toBe(false);
    expect(limiter("two").success).toBe(true);
  });

  it("forgets attempts older than the window", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const limiter = createLimiter();

    limiter("key");
    limiter("key");
    limiter("key");
    expect(limiter("key").success).toBe(false);

    vi.setSystemTime(Date.now() + WINDOW_MS + 1);

    expect(limiter("key").success).toBe(true);
  });

  // The behaviour sign-in depends on: it has to ask before calling Supabase
  // but may only charge the attempt once the password turns out to be wrong
  // (ADR 0043, update). A peek that counted would spend the budget on
  // successful logins too.
  it("does not count an attempt when record is false", () => {
    const limiter = createLimiter();

    for (let index = 0; index < 10; index += 1) {
      const result = limiter("key", { record: false });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(3);
    }

    expect(limiter("key").remaining).toBe(2);
  });

  it("still reports a key that is over the limit when record is false", () => {
    const limiter = createLimiter();

    limiter("key");
    limiter("key");
    limiter("key");

    expect(limiter("key", { record: false }).success).toBe(false);
  });
});
