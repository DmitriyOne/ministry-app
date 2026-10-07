"use client";

import { startTransition, useActionState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { requestPasswordReset } from "../api/request-password-reset-action";
import {
  createRequestPasswordResetSchema,
  requestPasswordResetInitialState,
  type RequestPasswordResetFormValues,
} from "./schema";

// Same shape as use-sign-in.ts, minus everything that only sign-in needs:
// no redirect, no toast, no "unavailable" branch — the action answers the
// same way whatever happens, so the only state the form has is "sent".
export const useRequestPasswordReset = () => {
  const t = useTranslations("screens.forgotPassword");
  const [state, submitAction, isPending] = useActionState(
    requestPasswordReset,
    requestPasswordResetInitialState,
  );

  const schema = useMemo(() => createRequestPasswordResetSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RequestPasswordResetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // For errors the client-side schema missed (defence in depth): the
  // server validates the same values with the same schema.
  useEffect(() => {
    if (state.status !== "error") return;
    if (state.fieldErrors?.email) setError("email", { type: "server", message: state.fieldErrors.email });
  }, [state, setError]);

  return {
    control,
    // startTransition is required: submitAction is called directly rather
    // than through form action, and without a transition isPending does
    // not update.
    onSubmit: () => handleSubmit((values) => startTransition(() => submitAction(values)))(),
    hasErrors: Object.keys(errors).length > 0,
    isPending,
    isSent: state.status === "success",
  };
};
