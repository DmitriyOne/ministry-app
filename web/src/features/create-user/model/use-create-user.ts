"use client";

import { startTransition, useActionState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { DEFAULT_APP_ROLE } from "@/shared/lib/auth";

import { createUser } from "../api/create-user-action";
import {
  createCreateUserSchema,
  createUserInitialState,
  type CreateUserFormValues,
} from "./schema";

export const useCreateUser = () => {
  const t = useTranslations("screens.adminNewUser");
  const [state, submitAction, isPending] = useActionState(createUser, createUserInitialState);

  const schema = useMemo(() => createCreateUserSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", displayName: "", password: "", role: DEFAULT_APP_ROLE },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // For errors the client-side schema missed (defence in depth): the
  // server validates the same values with the same schema.
  useEffect(() => {
    if (state.status !== "error" || !state.fieldErrors) return;

    for (const field of ["email", "displayName", "password"] as const) {
      const message = state.fieldErrors[field];

      if (message) setError(field, { type: "server", message });
    }
  }, [state, setError]);

  // Emptied only on success, and deliberately: issuing several accounts in
  // a row is the normal case, and a form still holding the previous
  // person's password is both confusing and a way to create a duplicate by
  // pressing the button twice.
  useEffect(() => {
    if (state.status === "success") reset();
  }, [state, reset]);

  return {
    control,
    onSubmit: () => handleSubmit((values) => startTransition(() => submitAction(values)))(),
    hasErrors: Object.keys(errors).length > 0,
    isPending,
    formError: state.status === "error" ? state.formError : undefined,
    createdEmail: state.status === "success" ? state.createdEmail : undefined,
  };
};
