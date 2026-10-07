import { z } from "zod";

import { createAccountEmailSchema } from "@/shared/lib/email";

export type RequestPasswordResetFormValues = {
  email: string;
};

export type RequestPasswordResetActionState = {
  // No "unavailable" and no account-specific outcome on purpose: nothing
  // here talks to Supabase yet, and the answer must not depend on whether
  // the address has an account (see api/request-password-reset-action.ts).
  status: "idle" | "success" | "error";
  fieldErrors?: Partial<Record<keyof RequestPasswordResetFormValues, string>>;
};

export const requestPasswordResetInitialState: RequestPasswordResetActionState = {
  status: "idle",
};

type RequestPasswordResetTranslator = (
  key: "emailRequired" | "emailInvalid" | "emailTooLong",
) => string;

// One field, and the same definition of an account address the sign-in form
// uses (shared/lib/email) — a reset request for an address that could not
// belong to anyone here is a typo, and saying so costs nothing.
export const createRequestPasswordResetSchema = (t: RequestPasswordResetTranslator) =>
  z.object({ email: createAccountEmailSchema(t) });
