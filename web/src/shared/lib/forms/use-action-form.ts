"use client";

import { startTransition, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import type { ZodType } from "zod";

import { showToast } from "@/shared/ui/sonner";

// The mechanics every form in this project repeats: the schema validates
// on the client before submitting and on the server again (the
// client-side check can be bypassed), the server's field errors are fed
// back into react-hook-form, a submit already in flight refuses a second
// one, and a backend that did not answer becomes a toast (ADR 0046)
// rather than something inside the form.
//
// It does NOT react to success. Sign-in writes a greeting and navigates,
// the admin form toasts and empties itself, the password reset does
// nothing at all — three different things, not variations of one, so the
// caller keeps `state` and acts on it. Four near-identical hooks are what
// this replaces: the sameness was forty lines, the differences four each.
//
// useActionState stays at the call site on purpose. Taking the action and
// its initial state as options would make this hook generic over the
// state type in the one position (`Awaited<TState>`) where TypeScript
// cannot reduce it, and the only way through is a cast — a cast in the
// shared piece, hiding exactly the mismatch it exists to catch. One line
// per caller is cheaper than that.
export type ActionFormState<TValues extends FieldValues> = {
  status: string;
  // Keyed by field name, so a field added to the schema cannot leave its
  // server-side error with nowhere to go.
  fieldErrors?: Partial<Record<Path<TValues>, string | undefined>>;
  formError?: string;
};

type UseActionFormOptions<TValues extends FieldValues, TState extends ActionFormState<TValues>> = {
  // The three values useActionState hands back at the call site.
  state: TState;
  submitAction: (values: TValues) => void;
  isPending: boolean;
  schema: ZodType<TValues, TValues>;
  defaultValues: DefaultValues<TValues>;
  // Shown as a toast whenever the action answers "unavailable". Omitted
  // by a form whose action has no such answer — the password reset
  // answers the same way whatever happens, on purpose (ADR 0043).
  unavailableMessage?: string;
};

export const useActionForm = <
  TValues extends FieldValues,
  TState extends ActionFormState<TValues>,
>({
  state,
  submitAction,
  isPending,
  schema,
  defaultValues,
  unavailableMessage,
}: UseActionFormOptions<TValues, TState>) => {
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TValues>({
    resolver,
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Defence in depth: these are the errors the client-side schema missed.
  // The fields come from defaultValues rather than from a list each form
  // keeps beside its schema — a list is the thing that goes out of date.
  useEffect(() => {
    if (state.status !== "error" || !state.fieldErrors) return;

    for (const field of Object.keys(defaultValues) as Path<TValues>[]) {
      const message = state.fieldErrors[field];

      if (message) setError(field, { type: "server", message });
    }
    // defaultValues is an object literal at the call site, so it is new on
    // every render and cannot be a dependency. Only its KEYS are read
    // here, and those are fixed by the schema's type.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, setError]);

  useEffect(() => {
    if (state.status === "unavailable" && unavailableMessage) {
      showToast({ message: unavailableMessage, tone: "negative" });
    }
  }, [state, unavailableMessage]);

  // Everything the caller gets is decided here, above the return, so the
  // returned object is a list of names and nothing else.
  //
  // A second submit while the first is in flight would send the same
  // values twice: the button is disabled while pending, but Enter in a
  // field submits the form without going through the button.
  //
  // startTransition is required because submitAction is called directly
  // rather than through a form action — without it isPending never
  // updates, and React warns about it at runtime.
  const submit = (values: TValues) => startTransition(() => submitAction(values));

  const onSubmit = () => {
    if (isPending) return;

    handleSubmit(submit)();
  };

  const hasErrors = Object.keys(errors).length > 0;
  const formError = state.status === "error" ? state.formError : undefined;

  return { control, reset, onSubmit, hasErrors, isPending, formError };
};
