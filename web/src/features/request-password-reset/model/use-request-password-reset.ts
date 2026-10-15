"use client";

import { useActionState, useMemo } from "react";
import { useTranslations } from "next-intl";

import { useActionForm } from "@/shared/lib/forms";

import { requestPasswordReset } from "../api/request-password-reset-action";
import {
  createRequestPasswordResetSchema,
  requestPasswordResetInitialState,
} from "./schema";

// The thinnest of the three: no redirect, no toast, no "unavailable"
// branch — the action answers the same way whatever happens (ADR 0043,
// so that the form cannot be used to find out whether an address has an
// account), which leaves "sent" as the only state of its own.
export const useRequestPasswordReset = () => {
  const t = useTranslations("screens.forgotPassword");

  const schema = useMemo(() => createRequestPasswordResetSchema(t), [t]);

  const [state, submitAction, isPending] = useActionState(
    requestPasswordReset,
    requestPasswordResetInitialState,
  );

  const form = useActionForm({
    state,
    submitAction,
    isPending,
    schema,
    defaultValues: { email: "" },
  });

  const isSent = state.status === "success";

  return { ...form, isSent };
};
