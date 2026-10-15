import { z } from "zod";

// Accounts live on one domain and are issued by the owner, so an address
// anywhere else cannot belong to anyone here. Checking it in the form is
// what keeps a typo, or a throwaway address someone tried, from reaching
// the auth server at all — which also means the disposable-domain list the
// waitlist uses is unnecessary: every one of those domains is already out.
export const ALLOWED_EMAIL_DOMAIN = "jw.fenko.dev";

// Printable ASCII only. An address outside it cannot be one of ours, and
// the same rule applies to a password typed in another keyboard layout: it
// is far more often a mistake than a choice, and the kind of mistake that
// is invisible on screen, because U+0430 renders exactly like a Latin "a".
// (Spelled as a code point on purpose: pasting the character would make
// this comment as unreadable as the bug it describes.)
export const PRINTABLE_ASCII_PATTERN = /^[\x20-\x7E]+$/;

// The three messages every form asking for an account address needs. Both
// namespaces that use this schema spell the keys the same way, so a form
// passes its own `t` straight in.
export type AccountEmailTranslator = (
  key: "emailRequired" | "emailInvalid" | "emailTooLong",
) => string;

// One definition of "an address that could belong to an account here",
// shared by every form that asks for one (sign-in, password reset). It
// lives in shared/lib rather than in one of those features because a
// feature may not import another feature's slice — and because the rule is
// the project's, not any one form's: the two would drift apart the first
// time only one of them was updated.
export const createAccountEmailSchema = (t: AccountEmailTranslator) =>
  z
    .string()
    .min(1, t("emailRequired"))
    // .max(254) before .pipe(): z.email() puts no limit on length (RFC 5321).
    .max(254, t("emailTooLong"))
    .pipe(z.email(t("emailInvalid")))
    // Same message again: anything that is not an address of ours is just
    // "not a valid address" as far as the form is willing to say.
    .refine((email) => PRINTABLE_ASCII_PATTERN.test(email), t("emailInvalid"))
    // Deliberately the SAME message as a malformed address, not a
    // "use your <domain> address" hint: the form must not tell someone
    // probing it which domain holds accounts. A wrong domain and a typo
    // are indistinguishable from the outside, which is the point.
    //
    // Lowercased first: the domain part of an address is case-insensitive,
    // so an address typed in capitals is the same address.
    .refine((email) => email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`), t("emailInvalid"));
