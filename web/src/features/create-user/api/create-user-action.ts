"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import * as Sentry from "@sentry/nextjs";

import { getSessionClaims } from "@/entities/session";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/shared/api";
import { hasRole } from "@/shared/lib/auth";
import { reportActionFailure } from "@/shared/lib/action-failure";
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
  //
  // This is the cheap half of the check: the role as the token claims it,
  // verified without leaving the process. It rejects everyone who is not
  // an admin at all. The second half — is that claim still true — is
  // further down, once there is a client to ask the database with.
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

    // The second half of the authorisation check, and the reason the
    // token is not enough on its own: both halves of what it says go
    // stale. It carries the role for an hour (`jwt_expiry`), and it keeps
    // verifying for that hour even after the account behind it is banned
    // — measured on a live database, not assumed: after a ban, GoTrue
    // answers 403 but PostgREST still serves the same token, because all
    // it checks is the signature.
    //
    // For navigation that gap is deliberate (ADR 0044: the gate must not
    // cost a round trip per screen). For issuing an account it is not, so
    // this path pays for two answers it cannot get from the token:
    //
    //   getUser()  — is this session still real? One call to the auth
    //                server, which is the only thing that knows about a
    //                ban or a sign-out elsewhere.
    //   user_roles — is the role still what the token claims?
    //
    // Twice over a path that runs once per issued account.
    const supabase = await createServerSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    // 401/403 is the auth server saying this session is no longer good
    // enough — banned, signed out elsewhere, token no longer accepted.
    // Anything else (no answer, a 5xx) says nothing about the session, and
    // "we could not ask" must not be reported as "you may not": one is an
    // outage the admin waits out, the other is a refusal they would go
    // looking for an explanation of (ADR 0046).
    if (userError) {
      const isRefusal = userError.status === 401 || userError.status === 403;

      console.warn("[create-user] rejected", {
        reason: isRefusal ? "session-not-live" : "session-check-failed",
        status: userError.status,
      });

      return isRefusal
        ? { status: "error", formError: t("notAllowed") }
        : { status: "unavailable" };
    }

    if (!userData.user) {
      console.warn("[create-user] rejected", { reason: "session-not-live" });

      return { status: "error", formError: t("notAllowed") };
    }

    // `deleted_at is null` for the same reason it is in every policy
    // (ADR 0047): a row marked deleted must not grant anything.
    const { data: currentRole, error: roleReadError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (roleReadError) {
      // The database could not answer, so whether this person may act is
      // unknown — and unknown is not permission. Reported as an outage
      // rather than as "not allowed", because that is what it is.
      Sentry.captureException(roleReadError);
      console.warn("[create-user] rejected", { reason: "role-read", code: roleReadError.code });

      return { status: "unavailable" };
    }

    if (currentRole?.role !== "admin") {
      console.warn("[create-user] rejected", { reason: "role-revoked" });

      return { status: "error", formError: t("notAllowed") };
    }

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

      // 422 is what GoTrue answers for an address that already exists —
      // that one is about the form, and saying so is not a leak here: the
      // person reading it is an admin who may look the account up anyway.
      // Anything else is the auth server not doing its job, which is not
      // this form's business to display (ADR 0046).
      if (error?.status === 422) return { status: "error", formError: t("emailTaken") };

      return { status: "unavailable" };
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
    reportActionFailure({ scope: "create-user", error });

    return { status: "unavailable" };
  }
};
