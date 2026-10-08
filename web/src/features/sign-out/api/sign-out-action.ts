"use server";

import { redirect } from "next/navigation";

import * as Sentry from "@sentry/nextjs";

import { createServerSupabaseClient } from "@/shared/api";
import { routes } from "@/shared/config";
import { redactEmails } from "@/shared/lib/observability";

export const signOut = async (): Promise<void> => {
  try {
    const supabase = await createServerSupabaseClient();

    // Clears the session cookies through the same cookie adapter the rest
    // of the app reads them with; the proxy sees a request without a
    // session from the very next navigation.
    await supabase.auth.signOut();
  } catch (error) {
    // A failure here is not shown to anyone: the redirect below happens
    // either way. Leaving someone on the profile screen that looks signed
    // out, or with an error they cannot act on, is worse than sending
    // them to /login, where the session is checked again from scratch —
    // and if it survived, the gate sends them straight back to /day.
    Sentry.captureException(error);

    console.warn("[sign-out] failed", {
      error: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? redactEmails(error.message) : undefined,
    });
  }

  // Outside the try on purpose: redirect() works by throwing a
  // NEXT_REDIRECT error that the framework catches, so a catch block
  // around it would swallow the navigation and leave the person where
  // they were.
  redirect(routes.login);
};
