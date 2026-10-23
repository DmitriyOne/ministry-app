"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { findMinistryStatusChoice, parseMonthKey } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { createServerSupabaseClient } from "@/shared/api";
import { routes } from "@/shared/config";
import { reportActionFailure } from "@/shared/lib/action-failure";
import { firstFieldErrors } from "@/shared/lib/forms";

import {
  createSetMinistryStatusSchema,
  parseGoalHours,
  type SetMinistryStatusActionState,
  type SetMinistryStatusValues,
} from "../model/schema";

// A check constraint or a raise from set_ministry_status: the month was
// outside its bounds, or the hours did not belong to the status. Those
// are refusals, not outages, and they must not be reported as "the
// server did not answer".
const CHECK_VIOLATION = "23514";

export const setMinistryStatus = async (
  values: SetMinistryStatusValues,
): Promise<SetMinistryStatusActionState> => {
  const t = await getTranslations("screens.profile.ministrySheet");

  // The screen is already behind a session (proxy.ts), and the database
  // would refuse an anonymous write anyway — set_ministry_status raises
  // without auth.uid(). This is the third of those three checks, and it
  // is here for the same reason as in create-user: a Server Action is a
  // public endpoint, reachable by anyone who can craft the request.
  const claims = await getSessionClaims();

  if (!claims) return { status: "error", formError: t("notSignedIn") };

  const result = createSetMinistryStatusSchema(t).safeParse(values);

  // Under the field, not above the form: the only thing in here a person
  // can get wrong is their own goal (ADR 0013).
  if (!result.success) return { status: "error", fieldErrors: firstFieldErrors(result.error) };

  const choice = findMinistryStatusChoice(result.data.choiceId);
  const currentMonth = parseMonthKey(result.data.currentMonth);

  // Both were just validated by the schema; narrowing them again is what
  // lets this file hold no non-null assertion.
  if (!choice || !currentMonth) return { status: "error", formError: t("invalidChoice") };

  try {
    const supabase = await createServerSupabaseClient();

    // The publisher is the only status whose hours are the person's own
    // (the owner's rule: a pioneer's numbers are not theirs to change),
    // so it is the only one whose number comes from the request. Every
    // other status takes its hours from the catalogue, by id.
    const goalHours = choice.status === "publisher"
      ? parseGoalHours(result.data.goalHours)
      : choice.hours;

    // The month the device sent, and no arithmetic on it: a choice is
    // the status the person is on NOW, changed again whenever they need
    // (the owner's rule — nothing is ever set ahead), so there is no
    // second month to work out here. The database refuses a month that
    // is nobody's present, which is what keeps a runaway clock out.
    const { error } = await supabase.rpc("set_ministry_status", {
      p_month: currentMonth,
      p_status: choice.status,
      // Omitted rather than null for a status with no hours: the
      // generated signature has the argument optional, and leaving it
      // out lets the function's own default (null) stand — which is
      // exactly "a publisher with no goal".
      p_monthly_goal: goalHours ?? undefined,
    });

    if (error) {
      // A refusal from the database is the person's problem to see, an
      // outage is not. Anything else is reported as an outage: it is the
      // honest answer when we do not know.
      if (error.code === CHECK_VIOLATION) {
        reportActionFailure({ scope: "set-ministry-status", error, outcome: "rejected" });

        return { status: "error", formError: t("refused") };
      }

      throw error;
    }

    // The profile is where the status is shown, and it is rendered on the
    // server: without this the pill would keep saying the old status
    // until a full reload. The sheet lives on that same screen, so this
    // is the "another screen must change" rule applied to the screen the
    // action was invoked from.
    revalidatePath(routes.profile);

    return { status: "success" };
  } catch (error) {
    reportActionFailure({ scope: "set-ministry-status", error, outcome: "failed" });

    return { status: "unavailable" };
  }
};
