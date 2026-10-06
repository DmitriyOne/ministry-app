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

type SignInTranslator = (
  key:
    | "emailRequired"
    | "emailInvalid"
    | "emailTooLong"
    | "passwordRequired"
    | "passwordTooShort"
    | "passwordNeedsUppercase"
    | "passwordNeedsDigit"
    | "passwordNeedsSymbol",
) => string;

// Accounts live on one domain and are issued by the owner, so an address
// anywhere else cannot belong to anyone here. Checking it in the form is
// what keeps a typo, or a throwaway address someone tried, from reaching
// the auth server at all — which also means the disposable-domain list the
// waitlist uses is unnecessary: every one of those domains is already out.
export const ALLOWED_EMAIL_DOMAIN = "jw.fenko.dev";

// Counted, not merely detected: the rule asks for two capitals, so the
// match has to be collected rather than tested. \p{Lu} with the u flag
// covers non-Latin capitals too, which matters because nothing restricts a
// password to ASCII.
const UPPERCASE_PATTERN = /\p{Lu}/gu;
const DIGIT_PATTERN = /\p{Nd}/u;
// A symbol is "neither a letter nor a number", which is the definition that
// survives contact with non-Latin input; a hand-written list of punctuation
// would not.
const SYMBOL_PATTERN = /[^\p{L}\p{N}]/u;

export const createSignInSchema = (t: SignInTranslator) =>
  z.object({
    // .max(254) before .pipe(): z.email() puts no limit on length (RFC 5321).
    email: z
      .string()
      .min(1, t("emailRequired"))
      .max(254, t("emailTooLong"))
      .pipe(z.email(t("emailInvalid")))
      // Deliberately the SAME message as a malformed address, not a
      // "use your <domain> address" hint: the form must not tell someone
      // probing it which domain holds accounts. A wrong domain and a typo
      // are indistinguishable from the outside, which is the point.
      //
      // Lowercased first: the domain part of an address is case-insensitive,
      // so an address typed in capitals is the same address.
      .refine(
        (email) => email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
        t("emailInvalid"),
      ),
    password: z
      .string()
      .min(1, t("passwordRequired"))
      .min(8, t("passwordTooShort"))
      .refine(
        (password) => (password.match(UPPERCASE_PATTERN)?.length ?? 0) >= 2,
        t("passwordNeedsUppercase"),
      )
      .refine((password) => DIGIT_PATTERN.test(password), t("passwordNeedsDigit"))
      .refine((password) => SYMBOL_PATTERN.test(password), t("passwordNeedsSymbol")),
  });
