"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import * as Sentry from "@sentry/nextjs";

import { getSessionClaims } from "@/entities/session";
import { createAdminSupabaseClient } from "@/shared/api";
import { hasRole } from "@/shared/lib/auth";
import { redactEmails } from "@/shared/lib/observability";
import { getClientIp } from "@/shared/lib/rate-limit";

import { checkCreateUserRateLimit } from "./rate-limit";
import {
  createCreateUserSchema,
  type CreateUserActionState,
  type CreateUserFormValues,
} from "../model/schema";

export const createUser = async (
  _previousState: CreateUserActionState,
  values: CreateUserFormValues,
): Promise<CreateUserActionState> => {
  const t = await getTranslations("screens.adminNewUser");

  // The check that matters. proxy.ts already keeps the screen behind an
  // admin role, but a Server Action is a public endpoint of its own: it
  // is reachable by anyone who can craft the request, whatever screen
  // they can or cannot open. The screen's gate protects the screen; this
  // line protects the account table.
  const claims = await getSessionClaims();

  if (!hasRole(claims, "admin")) {
    console.warn("[create-user] rejected", { reason: "not-admin" });

    return { status: "error", formError: t("notAllowed") };
  }

  // The IP is only ever a rate-limit key: never logged or persisted.
  const ip = getClientIp(await headers());

  if (!checkCreateUserRateLimit(ip).success) {
    console.warn("[create-user] rejected", { reason: "rate-limit" });

    return { status: "error", formError: t("tooManyRequests") };
  }

  const result = createCreateUserSchema(t).safeParse(values);

  if (!result.success) {
    const { email, displayName, password, passwordConfirm }
      = z.flattenError(result.error).fieldErrors;

    return {
      status: "error",
      fieldErrors: {
        email: email?.[0],
        displayName: displayName?.[0],
        password: password?.[0],
        passwordConfirm: passwordConfirm?.[0],
      },
    };
  }

  const { email, displayName, password, role } = result.data;

  try {
    // The one client that bypasses RLS (ADR 0037). Creating an account is
    // exactly the kind of thing it exists for, and the authorisation it
    // does not do is the check above.
    const admin = createAdminSupabaseClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      // No confirmation mail goes out — the admin hands over the
      // credentials in person — so the address is marked confirmed here.
      // Without it the account exists but cannot sign in.
      email_confirm: true,
      // handle_new_user (migration 20261005120000) reads display_name
      // from here and writes the profiles row; this is the only way to
      // give it a name at creation time.
      user_metadata: { display_name: displayName },
    });

    if (error || !data.user) {
      console.warn("[create-user] rejected", { reason: "auth-admin", status: error?.status });

      // 422 is what GoTrue answers for an address that already exists.
      // Saying so is not a leak here: the person reading it is an admin
      // who may look the account up anyway.
      return {
        status: "error",
        formError: error?.status === 422 ? t("emailTaken") : t("backendUnavailable"),
      };
    }

    // The trigger always writes the least privileged role, so an admin is
    // made by updating that row, never by a second insert — user_roles
    // has one row per person and a second one would be a conflict.
    if (role === "admin") {
      const { error: roleError } = await admin
        .from("user_roles")
        .update({ role })
        .eq("user_id", data.user.id);

      if (roleError) {
        // The account exists and can sign in; only the promotion failed.
        // Saying "created" would hide that, so this is an error — with the
        // account named, because the admin now has to finish the job in
        // Studio rather than create a second one.
        Sentry.captureException(roleError);
        console.warn("[create-user] role not applied", { code: roleError.code });

        return { status: "error", formError: t("roleNotApplied"), createdEmail: email };
      }
    }

    return { status: "success", createdEmail: email };
  } catch (error) {
    Sentry.captureException(error);

    console.warn("[create-user] rejected", {
      reason: "threw",
      error: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? redactEmails(error.message) : undefined,
    });

    return { status: "error", formError: t("backendUnavailable") };
  }
};
