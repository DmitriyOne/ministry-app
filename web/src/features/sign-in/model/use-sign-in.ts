"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { routes } from "@/shared/config";
import { useActionForm } from "@/shared/lib/forms";
import { writeWelcomeFlag } from "@/shared/lib/welcome-flag";

import { signIn } from "../api/sign-in-action";
import { createSignInSchema, signInInitialState } from "./schema";

// The mechanics — validate, submit, feed the server's field errors back,
// refuse a second submit, toast an outage — are shared
// (shared/lib/forms). What is left here is the only thing sign-in does
// differently from the other forms: what happens once it works.
export const useSignIn = () => {
  const t = useTranslations("screens.login");
  const router = useRouter();

  const schema = useMemo(() => createSignInSchema(t), [t]);

  const [state, submitAction, isPending] = useActionState(signIn, signInInitialState);

  const form = useActionForm({
    state,
    submitAction,
    isPending,
    schema,
    defaultValues: { email: "", password: "" },
    unavailableMessage: t("backendUnavailable"),
  });

  useEffect(() => {
    if (state.status !== "success") return;

    // The profile read can fail while sign-in itself succeeded, leaving no
    // name: then there is simply no greeting.
    if (state.displayName) writeWelcomeFlag(state.displayName);
    // replace, not push: with push the sign-in screen stays in history, and
    // Back would land on it — where the proxy, seeing a session, bounces
    // straight to /day again. Nothing breaks, but Back appears to do
    // nothing. Replacing drops that entry entirely.
    router.replace(routes.day);
  }, [state, router]);

  return form;
};
