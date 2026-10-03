import { z } from "zod";

import { isDisposableEmail } from "@/shared/lib/email";

// The same factory call is used on both the client
// (use-join-waitlist.ts, useTranslations) and the server
// (api/join-waitlist-action.ts, getTranslations) — one schema, no
// duplication, both fields' messages come from the dictionary (ADR 0014).
//
// z.string().min(1, ...).pipe(z.email(...)): ZodString.email() is
// deprecated in zod 4 in favour of the standalone z.email() (see
// context7/colinhacks/zod). .pipe() is needed to keep two DIFFERENT
// messages — "empty" and "not an email" — z.email() alone doesn't
// distinguish the two (an empty string is also "invalid format" to it).
export type JoinWaitlistFormValues = {
  email: string;
};

// The value of the honeypot field (shared/ui/honeypot-field.tsx), read
// from the form data at submission time rather than registered with
// react-hook-form — it isn't validated, it's a decoy for bots. Kept out of
// JoinWaitlistFormValues/the zod schema on purpose: it's not a real field
// of this form's data, only a submission-time signal for the server
// action (api/join-waitlist-action.ts).
export type JoinWaitlistSubmission = JoinWaitlistFormValues & { honeypot: string };

export type JoinWaitlistActionState = {
  status: "idle" | "success" | "error";
  fieldErrors?: Partial<Record<keyof JoinWaitlistFormValues, string>>;
  formError?: string;
  // Place in the waitlist as join_waitlist counted it, 1-based. Absent
  // on the honeypot path (api/join-waitlist-action.ts returns a bare
  // success for a filled decoy — ADR 0026), which is why every reader
  // has to cope with it being undefined.
  position?: number;
  // True when the address was already on the list, so the screen can say
  // so instead of implying a second signup was made.
  alreadyJoined?: boolean;
  // Present only for a genuinely new signup. It is a short-lived, one-time
  // capability used to attach this browser's PushSubscription without
  // exposing waitlist rows or accepting a client-provided "is new" flag.
  pushEnrollmentToken?: string;
};

export const joinWaitlistInitialState: JoinWaitlistActionState = { status: "idle" };

type JoinWaitlistTranslator = (
  key: "emailRequired" | "emailInvalid" | "emailTooLong" | "emailDisposable",
) => string;

export const createJoinWaitlistSchema = (t: JoinWaitlistTranslator) =>
  z.object({
    // .max(254) before .pipe(): z.email() puts no limit on length, but the
    // table does (RFC 5321's address limit, as a check constraint — see
    // the migration), so without this a 300-character address passes
    // validation and then fails in the database, turning a fixable field
    // error into a generic "try again".
    email: z
      .string()
      .min(1, t("emailRequired"))
      .max(254, t("emailTooLong"))
      .pipe(z.email(t("emailInvalid")))
      .refine((email) => !isDisposableEmail(email), t("emailDisposable")),
  });
