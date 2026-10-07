import { z } from "zod";

import { createAccountEmailSchema, PRINTABLE_ASCII_PATTERN } from "@/shared/lib/email";

// The same factory call is used on the client (use-sign-in.ts,
// useTranslations) and on the server (api/sign-in-action.ts,
// getTranslations): one schema, messages from the dictionary (ADR 0014).
export type SignInFormValues = {
  email: string;
  password: string;
};

export type SignInActionState = {
  // "unavailable" is the backend failing to answer (ADR 0046): the UI shows
  // it as a toast, not as a field error.
  status: "idle" | "success" | "error" | "unavailable";
  fieldErrors?: Partial<Record<keyof SignInFormValues, string>>;
  formError?: string;
  displayName?: string;
};

export const signInInitialState: SignInActionState = { status: "idle" };

type SignInTranslator = (
  key:
    | "emailRequired"
    | "emailInvalid"
    | "emailTooLong"
    | "passwordRequired"
    | "passwordTooShort"
    | "passwordLatinOnly"
    | "passwordNeedsUppercase"
    | "passwordNeedsDigit"
    | "passwordNeedsSymbol",
) => string;

// Counted, not merely detected: the rule asks for two capitals, so matches
// have to be collected rather than tested.
const UPPERCASE_PATTERN = /[A-Z]/g;
const DIGIT_PATTERN = /[0-9]/;
// "Neither a letter nor a digit" — within the ASCII range the field is
// already limited to, so a hand-written list of punctuation is unnecessary.
const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

export const createSignInSchema = (t: SignInTranslator) =>
  z.object({
    // The address rules are the project's, not this form's — the reset
    // form asks for the same thing (shared/lib/email).
    email: createAccountEmailSchema(t),
    password: z
      .string()
      .min(1, t("passwordRequired"))
      .min(8, t("passwordTooShort"))
      .refine((password) => PRINTABLE_ASCII_PATTERN.test(password), t("passwordLatinOnly"))
      .refine(
        (password) => (password.match(UPPERCASE_PATTERN)?.length ?? 0) >= 2,
        t("passwordNeedsUppercase"),
      )
      .refine((password) => DIGIT_PATTERN.test(password), t("passwordNeedsDigit"))
      .refine((password) => SYMBOL_PATTERN.test(password), t("passwordNeedsSymbol")),
  });
