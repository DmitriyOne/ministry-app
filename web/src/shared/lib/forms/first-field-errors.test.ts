import { describe, expect, it } from "vitest";
import { z } from "zod";

import { firstFieldErrors } from "./first-field-errors";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

const parseFailure = (input: unknown) => {
  const result = schema.safeParse(input);

  if (result.success) throw new Error("expected the parse to fail");

  return result.error;
};

describe("firstFieldErrors", () => {
  it("keeps one message per field", () => {
    const errors = firstFieldErrors(parseFailure({ email: "nope", password: "short", displayName: "" }));

    expect(Object.keys(errors).sort()).toEqual(["displayName", "email", "password"]);
    expect(typeof errors.email).toBe("string");
  });

  it("omits fields that parsed", () => {
    const errors = firstFieldErrors(
      parseFailure({ email: "someone@example.com", password: "longenough", displayName: "" }),
    );

    expect(errors.email).toBeUndefined();
    expect(errors.password).toBeUndefined();
    expect(errors.displayName).toBeDefined();
  });

  // The whole reason this function exists: a field nobody remembered to
  // list by hand still reports its error.
  it("covers a field without anyone naming it", () => {
    const extended = schema.extend({ nickname: z.string().min(2) });
    const result = extended.safeParse({
      email: "someone@example.com",
      password: "longenough",
      displayName: "Someone",
      nickname: "x",
    });

    if (result.success) throw new Error("expected the parse to fail");

    expect(firstFieldErrors(result.error).nickname).toBeDefined();
  });

  it("returns an empty object when the error carries no field errors", () => {
    const result = z.string().safeParse(42);

    if (result.success) throw new Error("expected the parse to fail");

    expect(firstFieldErrors(result.error as never)).toEqual({});
  });
});
