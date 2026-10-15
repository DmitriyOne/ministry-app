import { z } from "zod";

import { APP_ROLES, createAccountPasswordSchema } from "@/shared/lib/auth";
import { createAccountEmailSchema } from "@/shared/lib/email";

export type CreateUserFormValues = {
  email: string;
  displayName: string;
  password: string;
  passwordConfirm: string;
  role: (typeof APP_ROLES)[number];
};

export type CreateUserActionState = {
  // "unavailable" is the backend failing to answer (ADR 0046): the UI
  // shows it as a toast, not as something inside the form — nothing the
  // admin typed is wrong, and the form keeps every value for the retry.
  status: "idle" | "success" | "error" | "unavailable";
  fieldErrors?: Partial<Record<keyof CreateUserFormValues, string>>;
  // The whole form's problem: not an admin, too many attempts, the
  // address already taken, or the auth server not answering.
  formError?: string;
  // Echoed back so the screen can say which account was created without
  // the form keeping its own copy.
  createdEmail?: string;
};

export const createUserInitialState: CreateUserActionState = { status: "idle" };

type CreateUserTranslator = (
  key:
    | "emailRequired"
    | "emailInvalid"
    | "emailTooLong"
    | "nameRequired"
    | "nameTooLong"
    | "passwordRequired"
    | "passwordTooShort"
    | "passwordLatinOnly"
    | "passwordNeedsUppercase"
    | "passwordNeedsDigit"
    | "passwordNeedsSymbol"
    | "passwordMismatch",
) => string;

// The admin issues credentials, so this form sets a password rather than
// inviting someone to choose one — which is why it uses exactly the rules
// sign-in applies (shared/lib/auth): a password that cannot be typed back
// on the sign-in screen would lock the new account out on day one.
export const createCreateUserSchema = (t: CreateUserTranslator) =>
  z.object({
    email: createAccountEmailSchema(t),
    displayName: z
      .string()
      .trim()
      .min(1, t("nameRequired"))
      // profiles.display_name has no length limit of its own; this one is
      // about a name staying readable in a list, not about storage.
      .max(80, t("nameTooLong")),
    password: createAccountPasswordSchema(t),
    // Only "is it empty" here; whether the two match is checked below,
    // once both fields have a value. Repeating the full rule set would
    // show the same six complaints twice while someone types.
    passwordConfirm: z.string().min(1, t("passwordRequired")),
    // No message: the control is a pair of radios, so an invalid value
    // means the request did not come from this form at all.
    role: z.enum(APP_ROLES),
  })
  // On the confirmation field, not on the form: the message belongs under
  // the box the person can fix. The admin types a password they will
  // then read out to someone else, and a typo in it locks that person out
  // of an account that otherwise looks fine — which is the whole reason
  // for the second field.
    .refine((values) => values.password === values.passwordConfirm, {
      message: t("passwordMismatch"),
      path: ["passwordConfirm"],
    });
