import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stand-ins for the things that need a server, none of which carry the
// behaviour under test. The RPC spy IS the test: what reaches the
// database, and under whose id, is the whole question.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: () => new Headers({ "x-vercel-forwarded-for": "203.0.113.7" }),
}));

// vi.hoisted, because vi.mock's factories are lifted above every other
// statement in the file: a plain `const rpc = vi.fn()` is still in its
// temporal dead zone when the factory runs.
const { rpc, getSessionClaims, maybeSingle, sendNotification } = vi.hoisted(() => ({
  rpc: vi.fn(),
  getSessionClaims: vi.fn(),
  maybeSingle: vi.fn(),
  sendNotification: vi.fn(),
}));

// The query builder is a chain, so every link returns itself and only the
// last one answers.
const queryBuilder = {
  select: () => queryBuilder,
  eq: () => queryBuilder,
  is: () => queryBuilder,
  maybeSingle,
};

vi.mock("@/shared/api", () => ({
  createAdminSupabaseClient: () => ({ rpc, from: () => queryBuilder }),
}));
vi.mock("web-push", () => ({ default: { sendNotification } }));
// shared/config validates the environment the moment it is imported, and a
// test runner has no envs/web.local.env. Only the three VAPID values and
// one path are read here.
vi.mock("@/shared/config", () => ({
  env: {
    WEB_PUSH_VAPID_SUBJECT: "mailto:nobody@example.com",
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: "public-key",
    WEB_PUSH_VAPID_PRIVATE_KEY: "private-key",
  },
  routes: { profile: "/profile" },
}));
vi.mock("next-intl/server", () => ({ getTranslations: () => (key: string) => key }));
vi.mock("@/entities/session", () => ({ getSessionClaims }));
vi.mock("@/shared/lib/action-failure", () => ({ reportActionFailure: vi.fn() }));

import { disableUserPush } from "./disable-user-push-action";
import { enableUserPush } from "./enable-user-push-action";
import { sendTestPush } from "./send-test-push-action";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
// A real push service host — the schema rejects anything else, so a made-up
// domain would pass this test for the wrong reason.
const ENDPOINT = "https://web.push.apple.com/abcdef";

const subscription = { endpoint: ENDPOINT, keys: { p256dh: "key", auth: "auth" } };

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
  maybeSingle.mockReset();
  maybeSingle.mockResolvedValue({
    data: { endpoint: ENDPOINT, p256dh: "stored-key", auth: "stored-auth" },
    error: null,
  });
  sendNotification.mockReset();
  sendNotification.mockResolvedValue(undefined);
  getSessionClaims.mockReset();
  getSessionClaims.mockResolvedValue({ userId: USER_ID, role: "user" });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("enableUserPush", () => {
  it("writes the subscription under the id from the session", async () => {
    expect(await enableUserPush(subscription)).toEqual({ status: "success" });
    expect(rpc).toHaveBeenCalledWith("register_user_push_subscription", {
      p_user_id: USER_ID,
      p_endpoint: ENDPOINT,
      p_p256dh: "key",
      p_auth: "auth",
    });
  });

  // The action is a public endpoint reachable by anyone who can craft the
  // request (ADR 0045), so the id it writes under must come from the
  // verified token and never from the body — otherwise subscribing
  // someone else's account to your device is a POST away.
  it("ignores a user id supplied in the request", async () => {
    await enableUserPush({ ...subscription, userId: OTHER_USER_ID, p_user_id: OTHER_USER_ID });

    expect(rpc).toHaveBeenCalledWith(
      "register_user_push_subscription",
      expect.objectContaining({ p_user_id: USER_ID }),
    );
  });

  it("refuses without a session, without touching the database", async () => {
    getSessionClaims.mockResolvedValue(null);

    expect(await enableUserPush(subscription)).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  // isPushServiceEndpoint keeps the stored endpoint to the known push
  // services. Without it this action would store any URL, and the sender
  // would later post to it with our VAPID identity.
  it("refuses an endpoint that is not a push service", async () => {
    const result = await enableUserPush({
      ...subscription,
      endpoint: "https://attacker.example.com/collect",
    });

    expect(result).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a malformed payload", async () => {
    expect(await enableUserPush({ endpoint: ENDPOINT })).toEqual({ status: "error" });
    expect(await enableUserPush(null)).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  // Everything the person can see is one word. A database code or message
  // in the answer would be a detail of our schema handed to whoever asked.
  it("tells the caller nothing about why the database refused", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "23503", message: "insert violates foreign key \"push_subscriptions_user_id_fkey\"" },
    });

    expect(await enableUserPush(subscription)).toEqual({ status: "error" });
  });

  it("answers an exception the same way", async () => {
    rpc.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:54322"));

    expect(await enableUserPush(subscription)).toEqual({ status: "error" });
  });
});

describe("disableUserPush", () => {
  it("forgets the subscription under the id from the session", async () => {
    expect(await disableUserPush({ endpoint: ENDPOINT })).toEqual({ status: "success" });
    expect(rpc).toHaveBeenCalledWith("forget_user_push_subscription", {
      p_user_id: USER_ID,
      p_endpoint: ENDPOINT,
    });
  });

  it("refuses without a session, without touching the database", async () => {
    getSessionClaims.mockResolvedValue(null);

    expect(await disableUserPush({ endpoint: ENDPOINT })).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  // The row may already be gone — someone pressed the switch twice, or the
  // sender marked a dead endpoint first. The browser has unsubscribed
  // either way, so the state the caller asked for is the state they have.
  it("treats an already-forgotten subscription as success", async () => {
    rpc.mockResolvedValue({ data: false, error: null });

    expect(await disableUserPush({ endpoint: ENDPOINT })).toEqual({ status: "success" });
  });

  it("tells the caller nothing about why the database refused", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "permission denied for table push_subscriptions" } });

    expect(await disableUserPush({ endpoint: ENDPOINT })).toEqual({ status: "error" });
  });
});

describe("sendTestPush", () => {
  // The keys come from the stored row, never from the request: a test
  // notification must not be a way to push to a subscription whose secrets
  // leaked. The row is found by this person's id and the endpoint together.
  it("sends to the keys held in the database", async () => {
    expect(await sendTestPush({ endpoint: ENDPOINT })).toEqual({ status: "success" });
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: ENDPOINT, keys: { p256dh: "stored-key", auth: "stored-auth" } },
      expect.any(String),
      expect.objectContaining({ TTL: 300 }),
    );
  });

  it("sends nothing when this account has no such subscription", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    expect(await sendTestPush({ endpoint: ENDPOINT })).toEqual({ status: "error" });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("refuses without a session, without reading the database", async () => {
    getSessionClaims.mockResolvedValue(null);

    expect(await sendTestPush({ endpoint: ENDPOINT })).toEqual({ status: "error" });
    expect(maybeSingle).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  // The subscription is stored whatever the push service says; a delivery
  // that fails is reported as a failure of the delivery, not undone.
  it("reports a delivery failure without throwing", async () => {
    sendNotification.mockRejectedValue(new Error("410 Gone"));

    expect(await sendTestPush({ endpoint: ENDPOINT })).toEqual({ status: "error" });
  });
});
