"use client";

import { startTransition, useActionState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { joinWaitlist } from "../api/join-waitlist-action";
import { createJoinWaitlistSchema, joinWaitlistInitialState, type JoinWaitlistFormValues } from "./schema";

// Submission is a server action (joinWaitlist, api/join-waitlist-action.ts,
// "use server"), not a client handler: react-hook-form here only
// validates before submission (the same schema as the server — see
// schema.ts, no duplication) and passes already-checked, typed values
// straight into useActionState (not via the form's FormData — the
// official RHF/Server Actions integration example does the same), while
// server-side validation stays mandatory because the client-side check
// can be bypassed.
export const useJoinWaitlist = () => {
  const t = useTranslations("screens.comingSoon");
  const [state, submitAction, isPending] = useActionState(joinWaitlist, joinWaitlistInitialState);

  const schema = useMemo(() => createJoinWaitlistSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<JoinWaitlistFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Syncing external state (the server's response) into react-hook-form —
  // a legitimate use of useEffect, not a workaround for missing render
  // state: the server can return an error the client-side schema missed
  // (defense in depth), and it needs to show up under the same field.
  useEffect(() => {
    if (state.status === "error" && state.fieldErrors?.email) {
      setError("email", { type: "server", message: state.fieldErrors.email });
    }
  }, [state, setError]);

  return {
    control,
    // Takes the honeypot value as a plain argument rather than reading it
    // through react-hook-form (it's never registered — see schema.ts's
    // JoinWaitlistSubmission) — PillForm reads it off the native <form>'s
    // FormData at submit time and passes it through as its onSubmit's
    // second argument.
    //
    // startTransition is required: submitAction is called here directly
    // (not via form action="{submitAction}"/formAction), and outside that
    // direct usage React needs an explicit transition, otherwise
    // isPending doesn't update (React warns about it at runtime).
    onSubmit: (honeypotValue?: string) =>
      handleSubmit((values) =>
        startTransition(() => submitAction({ email: values.email, honeypot: honeypotValue ?? "" })),
      )(),
    hasErrors: Object.keys(errors).length > 0,
    isPending,
    submitted: state.status === "success",
    // Undefined when the server returned a success with no number — the
    // honeypot branch does exactly that on purpose (ADR 0026), so the
    // widget needs a wording that works without one.
    position: state.status === "success" ? state.position : undefined,
    alreadyJoined: state.status === "success" && state.alreadyJoined === true,
    formError: state.status === "error" ? state.formError : undefined,
  };
};
