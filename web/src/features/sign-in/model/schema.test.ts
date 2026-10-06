import { describe, expect, it } from "vitest";

import { ALLOWED_EMAIL_DOMAIN, createSignInSchema } from "./schema";

// The translator is the identity on the key, so an assertion names the rule
// that fired rather than a sentence that will be reworded.
const schema = createSignInSchema((key) => key);

const parse = (email: string, password: string) =>
  schema.safeParse({ email, password });

const errorFor = (field: "email" | "password", email: string, password: string) => {
  const result = parse(email, password);

  return result.success
    ? undefined
    : result.error.issues.find((issue) => issue.path[0] === field)?.message;
};

const VALID_EMAIL = `ruth@${ALLOWED_EMAIL_DOMAIN}`;
const VALID_PASSWORD = "TestPass1!";

describe("createSignInSchema: email", () => {
  it("accepts an address on the one domain accounts live on", () => {
    expect(parse(VALID_EMAIL, VALID_PASSWORD).success).toBe(true);
  });

  // The domain part of an address is case-insensitive, so this is the same
  // address and must not be rejected on a capital letter.
  it("accepts the domain in capitals", () => {
    expect(parse("Ruth@JW.FENKO.DEV", VALID_PASSWORD).success).toBe(true);
  });

  // The message is the same one a malformed address gets, on purpose: the
  // form must not hand someone probing it the name of the domain that holds
  // accounts.
  it("rejects any other domain, and says no more than it would about a typo", () => {
    expect(errorFor("email", "ruth@example.com", VALID_PASSWORD)).toBe("emailInvalid");
    expect(errorFor("email", "ruth@mailinator.com", VALID_PASSWORD)).toBe("emailInvalid");
    expect(errorFor("email", "ruth@test.jw.fenko.dev.evil.com", VALID_PASSWORD)).toBe("emailInvalid");
    expect(errorFor("email", "not-an-address", VALID_PASSWORD)).toBe("emailInvalid");
  });

  // endsWith on "@domain", not on the domain alone: without the @ an address
  // at a lookalike domain would pass.
  it("rejects a domain that merely ends with the allowed one", () => {
    expect(errorFor("email", "ruth@notjw.fenko.dev", VALID_PASSWORD)).toBe("emailInvalid");
  });

  it("reports an empty address as missing, not as malformed", () => {
    expect(errorFor("email", "", VALID_PASSWORD)).toBe("emailRequired");
  });
});

describe("createSignInSchema: password", () => {
  it("accepts one that meets every rule", () => {
    expect(parse(VALID_EMAIL, VALID_PASSWORD).success).toBe(true);
  });

  it("requires eight characters", () => {
    expect(errorFor("password", VALID_EMAIL, "AB1!abc")).toBe("passwordTooShort");
  });

  // Two, not one: a single capital is the common rule and is not this one.
  it("requires two capital letters, not one", () => {
    expect(errorFor("password", VALID_EMAIL, "Testpass1!")).toBe("passwordNeedsUppercase");
    expect(parse(VALID_EMAIL, "TestPass1!").success).toBe(true);
  });

  it("requires a digit", () => {
    expect(errorFor("password", VALID_EMAIL, "TestPassw!")).toBe("passwordNeedsDigit");
  });

  it("requires a symbol", () => {
    expect(errorFor("password", VALID_EMAIL, "TestPass12")).toBe("passwordNeedsSymbol");
  });

  // The rules are written in Unicode classes rather than ASCII ranges, so a
  // password in another script is judged by the same rules instead of being
  // rejected for not being Latin.
  it("counts non-Latin capitals and digits", () => {
    expect(parse(VALID_EMAIL, "ПРивет1!").success).toBe(true);
  });

  it("reports an empty password as missing, not as too short", () => {
    expect(errorFor("password", VALID_EMAIL, "")).toBe("passwordRequired");
  });
});
