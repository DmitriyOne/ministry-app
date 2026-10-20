import { afterEach, describe, expect, it, vi } from "vitest";

// The module under test reads one constant from `@/shared/config`, whose
// barrel also exports `env` — and `createEnv` validates the environment
// at import time, so pulling the real barrel into the runner fails before
// a single assertion runs. Mocked rather than imported past the barrel:
// steiger forbids the sidestep (fsd/no-public-api-sidestep), and the
// runner is deliberately kept free of environment setup (vitest.config
// .mts: "minimal runner for pure functions").
vi.mock("@/shared/config", () => ({
  WEB_API_ROUTES: { health: "/api/v1/health" },
}));

const { checkConnectivity } = await import("./check-connectivity");

// The probe is not a pure function — it is the one place in the feature
// that touches the network — so its three answers are pinned by stubbing
// what it touches: `navigator.onLine` and `fetch`. Worth the stubbing,
// because collapsing two of those answers into one is exactly the bug
// this file now exists to prevent.
const stubNavigator = (onLine: boolean | undefined) => {
  vi.stubGlobal("navigator", onLine === undefined ? {} : { onLine });
};

const stubFetch = (implementation: () => Promise<Response>) => {
  vi.stubGlobal("fetch", vi.fn(implementation));
};

const responseWith = (status: number) =>
  ({ ok: status >= 200 && status < 300, status }) as Response;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("checkConnectivity", () => {
  it("believes the browser when it says the radio is off, without asking the network", async () => {
    stubNavigator(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkConnectivity()).resolves.toBe("offline");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is reachable on a 204 from the health endpoint", async () => {
    stubNavigator(true);
    stubFetch(async () => responseWith(204));

    await expect(checkConnectivity()).resolves.toBe("reachable");
  });

  // The regression under test: these used to be "offline", so a broken
  // deployment told the person to check their Wi-Fi.
  it.each([500, 502, 503, 404, 302])(
    "calls an origin that answers %i unreachable, not offline",
    async (status) => {
      stubNavigator(true);
      stubFetch(async () => responseWith(status));

      await expect(checkConnectivity()).resolves.toBe("unreachable");
    },
  );

  it("is offline when the request fails outright", async () => {
    stubNavigator(true);
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(checkConnectivity()).resolves.toBe("offline");
  });

  // The Vercel preview case (ADR 0055): a cross-origin redirect to the
  // SSO page carries no CORS headers, so fetch rejects rather than
  // resolving. It has to read as offline and not as "our origin is
  // broken" — nothing answered us.
  it("is offline when a cross-origin redirect makes fetch reject", async () => {
    stubNavigator(true);
    stubFetch(async () => {
      throw new TypeError("NetworkError when attempting to fetch resource.");
    });

    await expect(checkConnectivity()).resolves.toBe("offline");
  });

  it("asks the origin with cookies and without caching", async () => {
    stubNavigator(true);
    const fetchMock = vi.fn(async () => responseWith(204));
    vi.stubGlobal("fetch", fetchMock);

    await checkConnectivity();

    // The stub takes no declared parameters, so its recorded call is typed
    // as empty — hence the cast rather than a signature nobody reads.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/v1/health");
    expect(init.credentials).toBe("same-origin");
    expect(init.cache).toBe("no-store");
  });

  it("does not depend on navigator existing at all", async () => {
    stubNavigator(undefined);
    stubFetch(async () => responseWith(204));

    await expect(checkConnectivity()).resolves.toBe("reachable");
  });
});
