import { describe, expect, it } from "vitest";

import { isDisposableEmail } from "./is-disposable-email";

describe("isDisposableEmail", () => {
  it("accepts a normal address", () => {
    expect(isDisposableEmail("person@gmail.com")).toBe(false);
  });

  it.each(["example.com", "example.net", "example.org"])(
    "catches the reserved domain %s",
    (domain) => {
      expect(isDisposableEmail(`a@${domain}`)).toBe(true);
    },
  );

  it.each(["test", "invalid", "localhost", "example"])(
    "catches the reserved top-level label .%s",
    (label) => {
      expect(isDisposableEmail(`someone@my.${label}`)).toBe(true);
    },
  );

  it("catches a known disposable provider", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
  });

  it("catches a subdomain of a known provider", () => {
    expect(isDisposableEmail("user@mail.tempmail.com")).toBe(true);
  });

  it("does not match a domain that merely ends with a provider's name", () => {
    expect(isDisposableEmail("user@notmailinator.com")).toBe(false);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(isDisposableEmail("  X@MAILINATOR.Com  ")).toBe(true);
  });

  it.each(["", "no-at-sign", "user@", "@", "   "])(
    "returns false for the malformed string %j without throwing",
    (value) => {
      expect(isDisposableEmail(value)).toBe(false);
    },
  );
});
