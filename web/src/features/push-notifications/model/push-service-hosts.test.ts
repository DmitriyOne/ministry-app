import { describe, expect, it } from "vitest";

import { isPushServiceEndpoint } from "./push-service-hosts";

describe("isPushServiceEndpoint", () => {
  it("accepts an Apple endpoint", () => {
    expect(isPushServiceEndpoint("https://web.push.apple.com/QIQmXw_abc")).toBe(
      true,
    );
  });

  it("accepts an FCM endpoint", () => {
    expect(
      isPushServiceEndpoint("https://fcm.googleapis.com/fcm/send/abc"),
    ).toBe(true);
  });

  it("accepts a Mozilla regional subdomain", () => {
    expect(
      isPushServiceEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"),
    ).toBe(true);
    expect(
      isPushServiceEndpoint("https://eu.push.services.mozilla.com/x"),
    ).toBe(true);
  });

  it("accepts a Windows regional subdomain", () => {
    expect(isPushServiceEndpoint("https://db5.notify.windows.com/x")).toBe(
      true,
    );
  });

  it("rejects a host that only ends with a vendor domain", () => {
    expect(isPushServiceEndpoint("https://evilnotify.windows.com/x")).toBe(
      false,
    );
  });

  it("rejects the wrong protocol", () => {
    expect(isPushServiceEndpoint("http://web.push.apple.com/x")).toBe(false);
  });

  it("rejects an arbitrary host", () => {
    expect(isPushServiceEndpoint("https://example.com/x")).toBe(false);
  });

  it("returns false for a malformed string without throwing", () => {
    expect(isPushServiceEndpoint("not a url")).toBe(false);
    expect(isPushServiceEndpoint("")).toBe(false);
  });
});
