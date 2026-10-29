import { z } from "zod";

import {
  findMinistryStatusChoice,
  MAX_MONTHLY_GOAL_HOURS,
  parseMonthKey,
} from "@/entities/ministry-status";

// What the sheet itself holds: one picked choice, and — for the
// publisher, the only status whose hours are the person's own — the
// number they typed. The month is not part of it, because it is read
// from the device at the moment of submitting rather than when the sheet
// was drawn.
// Where a status STARTS, asked only of the regular pioneer and only
// outside September (ADR 0061, update 2026-10-29). "current" is what
// every other status does and what this one did until now: the month the
// person is in. "service_year" backdates to the September that began the
// service year, so the year adds up to the 600 hours a pioneer knows.
export type MinistryStatusStart = "current" | "service_year";

export const MINISTRY_STATUS_STARTS = ["current", "service_year"] as const;

export type MinistryChoiceValues = {
  // One of the ids from MINISTRY_STATUS_CHOICES. The hours of every
  // other status are not sent: the server reads them off the id, so a
  // request cannot pair a status with hours that are not its own.
  choiceId: string;
  // A string, not a number: it is what a text field holds, and empty is
  // a real answer — a publisher with no goal at all.
  goalHours: string;
  // Answered by the sub-question under the pioneer's row. Every other
  // row leaves it at "current", and the server ignores it for them —
  // the same arrangement as the goal field, which only the publisher
  // owns.
  startFrom: MinistryStatusStart;
};

export type SetMinistryStatusValues = MinistryChoiceValues & {
  // The month the DEVICE is in, added by the sheet on its way out. The
  // phone owns the calendar (ADR 0061); the database fences a clock that
  // has run away, and the server works out from this whether the choice
  // starts now or next month.
  currentMonth: string;
};

export type SetMinistryStatusActionState = {
  // "unavailable" is the backend not answering (ADR 0046): a toast, not
  // something inside the sheet — nothing the person chose is wrong.
  status: "idle" | "success" | "error" | "unavailable";
  // Under the field it belongs to, never as a line above the form
  // (ADR 0013). Only the goal can be wrong in a way worth pointing at.
  fieldErrors?: Partial<Record<keyof MinistryChoiceValues, string>>;
  formError?: string;
};

export const setMinistryStatusInitialState: SetMinistryStatusActionState = { status: "idle" };

type SetMinistryStatusTranslator = (
  key: "invalidChoice" | "invalidMonth" | "goal.outOfRange",
) => string;

// The publisher is the only status that takes a number from the person
// (the owner's rule: pioneers' hours are not theirs to change), so the
// goal is checked only when the publisher is the choice. Anything typed
// and then abandoned for another status is ignored rather than refused.
//
// Asked of the catalogue rather than compared against a literal id: the
// ids are built there, and a second place that knows how they are spelt
// is a second place to fix when they change.
const isPublisherChoice = (choiceId: string): boolean =>
  findMinistryStatusChoice(choiceId)?.status === "publisher";

// Null means "no goal", which is different from "not a number".
export const parseGoalHours = (value: string): number | null => {
  const trimmed = value.trim();

  if (trimmed === "") return null;

  // Number("") is 0 and Number(" 12 ") is 12, so the emptiness is
  // settled above and the pattern keeps out everything that is not
  // digits — "12.5", "1e3" and "-4" included.
  if (!/^\d+$/.test(trimmed)) return Number.NaN;

  return Number(trimmed);
};

export const isValidGoalHours = (value: string): boolean => {
  const hours = parseGoalHours(value);

  if (hours === null) return true;

  return Number.isInteger(hours) && hours >= 1 && hours <= MAX_MONTHLY_GOAL_HOURS;
};

// Two schemas, one source: the fields and the rule are each written
// once, and the second schema is the first plus the month the sheet adds
// on its way out. The sheet validates what the person picked; the action
// validates what actually arrived. The client-side pass is a courtesy —
// it can be bypassed — and the server-side one is the rule.
const choiceFields = (t: SetMinistryStatusTranslator) => ({
  choiceId: z
    .string()
    .refine((id) => findMinistryStatusChoice(id) !== null, t("invalidChoice")),
  goalHours: z.string(),
  startFrom: z.enum(MINISTRY_STATUS_STARTS),
});

const checkGoal = (t: SetMinistryStatusTranslator) =>
  (values: MinistryChoiceValues, ctx: z.RefinementCtx) => {
    if (!isPublisherChoice(values.choiceId)) return;
    if (isValidGoalHours(values.goalHours)) return;

    ctx.addIssue({
      code: "custom",
      path: ["goalHours"],
      message: t("goal.outOfRange"),
    });
  };

export const createMinistryChoiceSchema = (t: SetMinistryStatusTranslator) =>
  z.object(choiceFields(t)).superRefine(checkGoal(t));

export const createSetMinistryStatusSchema = (t: SetMinistryStatusTranslator) =>
  z
    .object({
      ...choiceFields(t),
      currentMonth: z
        .string()
        .refine((value) => parseMonthKey(value) !== null, t("invalidMonth")),
    })
    .superRefine(checkGoal(t));
