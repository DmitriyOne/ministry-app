import { z } from "zod";

import { findMinistryStatusChoice, parseMonthKey } from "@/entities/ministry-status";

// What the sheet itself holds: one picked choice. The month is not part
// of it, because it is read from the device at the moment of submitting
// rather than when the sheet was drawn — a sheet left open across
// midnight on the last day of a month would otherwise write the wrong
// one.
export type MinistryChoiceValues = {
  // One of the ids from MINISTRY_STATUS_CHOICES. The hours are not sent:
  // the server reads them off the id, so a request cannot pair a status
  // with hours that are not its own.
  choiceId: string;
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
  formError?: string;
  // The month the new status actually starts in, as the SERVER worked it
  // out. Echoed back rather than assumed, because only the server knows
  // whether this was the first choice ever (which starts this month) or
  // a later one (which starts next).
  appliesFrom?: string;
};

export const setMinistryStatusInitialState: SetMinistryStatusActionState = { status: "idle" };

type SetMinistryStatusTranslator = (key: "invalidChoice" | "invalidMonth") => string;

// Two schemas, one source. The sheet validates what the person picked;
// the action validates what actually arrived, which is that plus a month
// the sheet added on its way out. The client-side pass is a courtesy —
// it can be bypassed — and the server-side one is the rule.
export const createMinistryChoiceSchema = (t: SetMinistryStatusTranslator) =>
  z.object({
    choiceId: z
      .string()
      .refine((id) => findMinistryStatusChoice(id) !== null, t("invalidChoice")),
  });

export const createSetMinistryStatusSchema = (t: SetMinistryStatusTranslator) =>
  createMinistryChoiceSchema(t).extend({
    currentMonth: z
      .string()
      .refine((value) => parseMonthKey(value) !== null, t("invalidMonth")),
  });
