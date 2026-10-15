import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readWelcomeFlag, writeWelcomeFlag } from "./welcome-flag";

// Vitest runs in node here, so there is no window: stand in a minimal
// in-memory sessionStorage.
const createMemoryStorage = () => {
  const data = new Map<string, string>();

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
};

beforeEach(() => {
  vi.stubGlobal("sessionStorage", createMemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("welcome flag", () => {
  it("round-trips the name and clears it, so the toast shows once", () => {
    writeWelcomeFlag("Ruth");

    expect(readWelcomeFlag()).toBe("Ruth");
    expect(readWelcomeFlag()).toBeNull();
  });

  it("returns null when nothing was stored", () => {
    expect(readWelcomeFlag()).toBeNull();
  });

  // Private mode throws on access. A greeting must never be the reason
  // the day screen fails to render.
  it("survives sessionStorage throwing", () => {
    const denied = () => {
      throw new Error("denied");
    };

    vi.stubGlobal("sessionStorage", { getItem: denied, setItem: denied, removeItem: denied });

    expect(() => writeWelcomeFlag("Ruth")).not.toThrow();
    expect(readWelcomeFlag()).toBeNull();
  });
});
