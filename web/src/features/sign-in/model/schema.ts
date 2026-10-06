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
    | "passwordLatinOnly"
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

// Printable ASCII only, for both fields. An address outside it cannot be
// one of ours, and a password typed in another keyboard layout is far more
// often a mistake than a choice — it is also the kind of mistake that is
// invisible on screen, because U+0430 renders exactly like a Latin "a".
// Rejecting it here is kinder than an "incorrect password" the person
// cannot explain. (Spelled as a code point on purpose: pasting the
// character would make this comment as unreadable as the bug it describes.)
const LATIN_ONLY_PATTERN = /^[\x20-\x7E]+$/;

// Counted, not merely detected: the rule asks for two capitals, so matches
// have to be collected rather than tested.
const UPPERCASE_PATTERN = /[A-Z]/g;
const DIGIT_PATTERN = /[0-9]/;
// "Neither a letter nor a digit" — within the ASCII range the field is
// already limited to, so a hand-written list of punctuation is unnecessary.
const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

export const createSignInSchema = (t: SignInTranslator) =>
  z.object({
    // .max(254) before .pipe(): z.email() puts no limit on length (RFC 5321).
    email: z
      .string()
      .min(1, t("emailRequired"))
      .max(254, t("emailTooLong"))
      .pipe(z.email(t("emailInvalid")))
      // Same message again: anything that is not an address of ours is just
      // "not a valid address" as far as the form is willing to say.
      .refine((email) => LATIN_ONLY_PATTERN.test(email), t("emailInvalid"))
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
      .refine((password) => LATIN_ONLY_PATTERN.test(password), t("passwordLatinOnly"))
      .refine(
        (password) => (password.match(UPPERCASE_PATTERN)?.length ?? 0) >= 2,
        t("passwordNeedsUppercase"),
      )
      .refine((password) => DIGIT_PATTERN.test(password), t("passwordNeedsDigit"))
      .refine((password) => SYMBOL_PATTERN.test(password), t("passwordNeedsSymbol")),
  });
