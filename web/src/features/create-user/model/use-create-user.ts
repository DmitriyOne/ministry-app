"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

import { DEFAULT_APP_ROLE } from "@/shared/lib/auth";
import { useActionForm } from "@/shared/lib/forms";
import { showToast } from "@/shared/ui/sonner";

import { createUser } from "../api/create-user-action";
import { createCreateUserSchema, createUserInitialState } from "./schema";

export const useCreateUser = () => {
  const t = useTranslations("screens.adminNewUser");

  const schema = useMemo(() => createCreateUserSchema(t), [t]);

  const [state, submitAction, isPending] = useActionState(createUser, createUserInitialState);

  const { reset, ...form } = useActionForm({
    state,
    submitAction,
    isPending,
    schema,
    defaultValues: {
      email: "",
      displayName: "",
      password: "",
      passwordConfirm: "",
      role: DEFAULT_APP_ROLE,
    },
    unavailableMessage: t("backendUnavailable"),
  });

  // Success is a toast, like every other answer that is not about a
  // field: it names the account and goes away on its own, where a plate
  // under the form would sit there while the admin types the next one.
  //
  // Emptying the form is deliberate too: issuing several accounts in a
  // row is the normal case, and a form still holding the previous
  // person's password is both confusing and a way to create a duplicate
  // by pressing the button twice.
  useEffect(() => {
    if (state.status !== "success") return;

    if (state.createdEmail) {
      showToast({ message: t("created", { email: state.createdEmail }), tone: "positive" });
    }

    reset();
  }, [state, reset, t]);

  return form;
};
