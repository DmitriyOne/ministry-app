import { z } from "zod";

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

type SignInTranslator = (key: "emailRequired" | "emailInvalid" | "emailTooLong" | "passwordRequired") => string;

// No isDisposableEmail check here, unlike the waitlist: the address was
// issued by the owner, so judging it would only lock real people out.
export const createSignInSchema = (t: SignInTranslator) =>
  z.object({
    // .max(254) before .pipe(): z.email() puts no limit on length (RFC 5321).
    email: z
      .string()
      .min(1, t("emailRequired"))
      .max(254, t("emailTooLong"))
      .pipe(z.email(t("emailInvalid"))),
    // Deliberately no strength or length rules: this is a check against an
    // existing password, not the choice of a new one.
    password: z.string().min(1, t("passwordRequired")),
  });
