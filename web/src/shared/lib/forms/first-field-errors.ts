import { z } from "zod";

// Turns a failed parse into the per-field shape every action state in this
// project uses: one message per field, the first one.
//
// Why a function and not three hand-written mappings (which is what this
// replaced): the hand-written version named each field explicitly, so
// adding a field to a schema and forgetting to add it here meant that
// field's server-side error was silently dropped — the form showed
// nothing and the person could not tell what was wrong. The client side
// was already protected from exactly this mistake (useActionForm derives
// its keys from defaultValues, ADR 0013); the server side was not.
//
// It lives in shared/lib/forms beside useActionForm even though only
// server code calls it. The barrel therefore hands a Server Action a
// module that also exports a "use client" hook — harmless in that
// direction (the hook becomes a client reference and is never executed on
// the server), unlike the reverse case ADR 0046 had to split apart, where
// a client bundle would have pulled in a `server-only` module and failed
// the build. The alternative was a seventeenth segment under shared/lib,
// which steiger already calls too many.
export const firstFieldErrors = <Values extends Record<string, unknown>>(
  error: z.ZodError<Values>,
): Partial<Record<keyof Values & string, string>> => {
  const result: Partial<Record<keyof Values & string, string>> = {};

  for (const [field, messages] of Object.entries(z.flattenError(error).fieldErrors)) {
    const first = (messages as string[] | undefined)?.[0];

    if (first !== undefined) result[field as keyof Values & string] = first;
  }

  return result;
};
