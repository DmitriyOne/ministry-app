import { z } from "zod";

import { createAccountPasswordSchema } from "@/shared/lib/auth";
import { createAccountEmailSchema } from "@/shared/lib/email";

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

export const createSignInSchema = (t: SignInTranslator) =>
  z.object({
    // The address rules are the project's, not this form's — the reset
    // form asks for the same thing (shared/lib/email).
    email: createAccountEmailSchema(t),
    // Same rules the admin's create-user form applies when it sets one
    // (shared/lib/auth).
    password: createAccountPasswordSchema(t),
  });
