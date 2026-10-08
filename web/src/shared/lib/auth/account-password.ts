import { z } from "zod";

import { PRINTABLE_ASCII_PATTERN } from "@/shared/lib/email";

// Counted, not merely detected: the rule asks for two capitals, so matches
// have to be collected rather than tested.
const UPPERCASE_PATTERN = /[A-Z]/g;
const DIGIT_PATTERN = /[0-9]/;
// "Neither a letter nor a digit" — within the ASCII range the field is
// already limited to, so a hand-written list of punctuation is
// unnecessary.
const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

export type AccountPasswordTranslator = (
  key:
    | "passwordRequired"
    | "passwordTooShort"
    | "passwordLatinOnly"
    | "passwordNeedsUppercase"
    | "passwordNeedsDigit"
    | "passwordNeedsSymbol",
) => string;

// What this project accepts as a password, in one place. Two forms ask
// for one: sign-in, where it is typed back, and the admin's "create a
// user" form, where it is set. They have to be the same rules or an
// account could be issued with a password its owner can never enter —
// which is exactly the kind of thing that only shows up in use.
export const createAccountPasswordSchema = (t: AccountPasswordTranslator) =>
  z
    .string()
    .min(1, t("passwordRequired"))
    .min(8, t("passwordTooShort"))
    .refine((password) => PRINTABLE_ASCII_PATTERN.test(password), t("passwordLatinOnly"))
    .refine(
      (password) => (password.match(UPPERCASE_PATTERN)?.length ?? 0) >= 2,
      t("passwordNeedsUppercase"),
    )
    .refine((password) => DIGIT_PATTERN.test(password), t("passwordNeedsDigit"))
    .refine((password) => SYMBOL_PATTERN.test(password), t("passwordNeedsSymbol"));
