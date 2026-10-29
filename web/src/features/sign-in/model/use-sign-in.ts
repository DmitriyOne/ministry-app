"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { currentDayKey, dayPath } from "@/entities/ministry-day";
import { routes } from "@/shared/config";
import { useActionForm } from "@/shared/lib/forms";
import { rememberTimeZone } from "@/shared/lib/time-zone";
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

    // Straight to the date when the profile answered. /day is only a
    // redirect to it, and going through it costs a second navigation —
    // the loading boundary is then drawn for /day, torn down and drawn
    // again for the date, which is the flicker the owner saw signing in
    // (ADR 0063, update 2026-10-29). Without the zone we do not know
    // which day it is, so /day works it out as before.
    //
    // The same answer is written down for the menu, which links to the
    // date itself: this is the earliest moment it can be known, so the
    // very first navigation after signing in already skips the hop.
    if (state.timeZone === undefined) {
      // replace, not push: with push the sign-in screen stays in
      // history, and Back would land on it — where the proxy, seeing a
      // session, bounces straight to /day again. Nothing breaks, but
      // Back appears to do nothing. Replacing drops that entry
      // entirely.
      router.replace(routes.day);

      return;
    }

    rememberTimeZone(state.timeZone);
    router.replace(dayPath(currentDayKey(state.timeZone)));
  }, [state, router]);

  return form;
};
