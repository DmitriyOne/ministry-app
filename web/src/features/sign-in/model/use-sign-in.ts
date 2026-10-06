"use client";

import { startTransition, useActionState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { routes } from "@/shared/config";
import { writeWelcomeFlag } from "@/shared/lib/welcome-flag";
import { showToast } from "@/shared/ui/sonner";

import { signIn } from "../api/sign-in-action";
import { createSignInSchema, signInInitialState, type SignInFormValues } from "./schema";

// Same shape as use-join-waitlist.ts: react-hook-form validates before
// submission with the schema the server uses too, and the already-checked
// values go straight into useActionState. Server-side validation stays
// mandatory, the client-side check can be bypassed.
export const useSignIn = () => {
  const t = useTranslations("screens.login");
  const router = useRouter();
  const [state, submitAction, isPending] = useActionState(signIn, signInInitialState);

  const schema = useMemo(() => createSignInSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Syncing the server's response into react-hook-form, for errors the
  // client-side schema missed (defence in depth).
  useEffect(() => {
    if (state.status !== "error") return;

    if (state.fieldErrors?.email) setError("email", { type: "server", message: state.fieldErrors.email });
    if (state.fieldErrors?.password) {
      setError("password", { type: "server", message: state.fieldErrors.password });
    }
  }, [state, setError]);

  // The backend not answering is not the person's mistake, so it is a
  // toast rather than a field error (ADR 0046). The form stays as it is
  // and nothing they typed is lost.
  useEffect(() => {
    if (state.status === "unavailable") {
      showToast({ message: t("backendUnavailable"), tone: "negative" });
    }
  }, [state, t]);

  useEffect(() => {
    if (state.status !== "success") return;

    // The profile read can fail while sign-in itself succeeded, leaving no
    // name: then there is simply no greeting.
    if (state.displayName) writeWelcomeFlag(state.displayName);
    router.push(routes.day);
  }, [state, router]);

  return {
    control,
    // startTransition is required: submitAction is called directly rather
    // than through form action, and without a transition isPending does
    // not update.
    onSubmit: () => handleSubmit((values) => startTransition(() => submitAction(values)))(),
    hasErrors: Object.keys(errors).length > 0,
    isPending,
    formError: state.status === "error" ? state.formError : undefined,
  };
};
