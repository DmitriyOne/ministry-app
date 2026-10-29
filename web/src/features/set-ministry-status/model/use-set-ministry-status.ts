"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";

import {
  deviceMonthKey,
  type EffectiveMinistryStatus,
  ministryStatusChoiceFor,
  type MonthKey,
  serviceYearGoalFrom,
  serviceYearStartMonth,
} from "@/entities/ministry-status";
import { useActionForm } from "@/shared/lib/forms";
import { type SheetDragHandlers, useSheetDrag } from "@/shared/ui/sheet";
import { showToast } from "@/shared/ui/sonner";

import { setMinistryStatus } from "../api/set-ministry-status-action";
import {
  createMinistryChoiceSchema,
  type MinistryChoiceValues,
  type MinistryStatusStart,
  type SetMinistryStatusActionState,
  setMinistryStatusInitialState,
} from "./schema";

type UseSetMinistryStatusOptions = {
  // What the person is on this month, as the screen read it. Null when
  // the read failed.
  status: EffectiveMinistryStatus | null;
  // Whether they were already a regular pioneer in the first month of
  // the service year — the answer the sub-question opens on.
  pioneeringSinceYearStart: boolean;
};

export type UseSetMinistryStatusResult = {
  sheet: {
    isOpen: boolean;
    open: () => void;
    onOpenChange: (isOpen: boolean) => void;
    dragY: number;
    dragHandlers: SheetDragHandlers;
  };
  confirm: {
    isOpen: boolean;
    ask: () => void;
    cancel: () => void;
    accept: () => void;
  };
  // The month the choice applies to — always the one the person is in —
  // in their own words. Formatted once, here, because both the sheet
  // and the dialog say it and they must not be able to disagree.
  monthLabel: string;
  // The two months the pioneer's sub-question names, already in words,
  // or null when there is nothing to ask: in September the service year
  // and the month under way are the same month, and a question with one
  // answer is furniture (ADR 0061, update 2026-10-29).
  pioneerStart: {
    serviceYear: string;
    currentMonth: string;
    // What the service year comes to under each answer — 600 from
    // September, one month less for every month after it. The sheet
    // says it out loud, because that difference is the only reason the
    // question is worth asking.
    yearGoalHours: { serviceYear: number; currentMonth: number };
  } | null;
  form: ReturnType<typeof useActionForm<MinistryChoiceValues, SetMinistryStatusActionState>>;
};

// The whole scenario of "change my ministry status": which panel is
// open, which month the choice will start in, what is sent and what
// happens afterwards. The widget that renders it holds no state of its
// own — it is markup around this (ADR 0049).
//
// The answer is handled where the submit happens rather than in an
// effect watching for it. The effect version was written first and the
// lint rejected it — "calling setState synchronously within an effect can
// trigger cascading renders" — which is the same thing Vercel's
// rerender-move-effect-to-event says: closing a panel is a consequence of
// pressing a button, not of a value changing. It also costs a ref-guard,
// because an effect has to work out whether it has already seen this
// answer, and a handler never has to ask.
//
// Hence no useActionState either: it hands the answer back as state, and
// the only way to act on state is an effect. useActionForm does not mind
// — it takes `state`, `submitAction` and `isPending` from the caller,
// whatever produces them, so the schema, the server's field errors, the
// refusal of a second submit in flight and the "backend did not answer"
// toast all still come from it.
// Midday rather than midnight: the key is a plain date, and a date
// parsed as UTC midnight is the previous day in any zone behind it,
// which would print the month before.
//
// The year is spelt out only in the sub-question, where two months from
// two different years can sit one under the other: "September" above
// "February" says nothing about which September it is.
const monthName = (
  format: ReturnType<typeof useFormatter>,
  month: MonthKey,
  withYear = false,
): string => format.dateTime(
  new Date(`${month}T12:00:00`),
  withYear ? { month: "long", year: "numeric" } : { month: "long" },
);

export const useSetMinistryStatus = (
  { status, pioneeringSinceYearStart }: UseSetMinistryStatusOptions,
): UseSetMinistryStatusResult => {
  const t = useTranslations("screens.profile.ministrySheet");
  const format = useFormatter();

  const [state, setState] = useState<SetMinistryStatusActionState>(
    setMinistryStatusInitialState,
  );
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  // Read when the sheet opens — in an event, never while rendering:
  // deviceMonthKey() reads the device's own calendar, and calling it
  // during a render would run it on the server too, with the server's
  // zone (ADR 0061).
  const [month, setMonth] = useState<MonthKey | null>(null);

  const { dragY, dragHandlers } = useSheetDrag({ onClose: () => setIsOpen(false) });

  // Which row is in force now, and so which row the sheet opens on —
  // and, for a publisher, the goal they set last time, so the field
  // opens with their own number rather than empty.
  const currentChoiceId = status
    ? ministryStatusChoiceFor(status.status, status.monthlyGoalHours)?.id ?? ""
    : "";
  const currentGoalHours = status?.status === "publisher" && status.monthlyGoalHours !== null
    ? String(status.monthlyGoalHours)
    : "";

  const startedWith: MinistryStatusStart = pioneeringSinceYearStart ? "service_year" : "current";

  const schema = useMemo(() => createMinistryChoiceSchema(t), [t]);

  const form = useActionForm<MinistryChoiceValues, SetMinistryStatusActionState>({
    state,
    isPending,
    schema,
    // The answer in force, not a fixed one. A row holds a status, not
    // the sentence that produced it, so "since when" is reconstructed
    // from the only thing that shows it: whether September is pioneered
    // too. Opening on the wrong answer is not cosmetic here — pressing
    // Save with "from this month" retracts September (ADR 0061, update
    // 2026-10-29).
    defaultValues: { choiceId: currentChoiceId, goalHours: currentGoalHours, startFrom: startedWith },
    submitAction: (values) => {
      startTransition(async () => {
        // The month is read HERE, as the form is submitted, and not when
        // the sheet was opened: a sheet left open across midnight on the
        // last day of a month would otherwise send the month it was
        // drawn in.
        const answer = await setMinistryStatus({
          ...values,
          currentMonth: deviceMonthKey(),
        });

        setState(answer);

        // The dialog goes whatever the answer was. On a refusal the
        // sheet stays open with the message in it — and that message is
        // rendered BEHIND the dialog, so leaving the dialog up would
        // hide the only thing worth reading.
        setIsConfirming(false);

        if (answer.status !== "success") return;

        showToast({ message: t("updated"), tone: "positive" });
        setIsOpen(false);
      });
    },
    unavailableMessage: t("unavailable"),
  });

  const open = () => {
    // Back to what is actually in force. Without this, picking a row,
    // dismissing the sheet and opening it again would show the abandoned
    // pick as though it had been saved.
    form.reset({ choiceId: currentChoiceId, goalHours: currentGoalHours, startFrom: startedWith });

    // The month to name in the sheet and in the dialog. There is only
    // ever one candidate: the choice applies to the month under way, and
    // the same person may change it again as often as they need.
    setMonth(deviceMonthKey());
    setIsOpen(true);
  };

  // Asking before sending means the values have to be good BEFORE the
  // question: "are you sure?" followed by "no, that number is wrong" is
  // the wrong order, and the message would be rendered behind the dialog
  // asking it.
  const ask = async () => {
    if (await form.validate()) setIsConfirming(true);
  };

  // The September this month belongs to, and whether it is worth asking
  // about: equal months mean the person is IN September, where "since
  // the service year began" and "from this month" say the same thing.
  const serviceYearStart = month ? serviceYearStartMonth(month) : null;
  const pioneerStart = month && serviceYearStart && serviceYearStart !== month
    ? {
        serviceYear: monthName(format, serviceYearStart, true),
        currentMonth: monthName(format, month, true),
        yearGoalHours: {
          serviceYear: serviceYearGoalFrom(serviceYearStart),
          currentMonth: serviceYearGoalFrom(month),
        },
      }
    : null;

  return {
    sheet: { isOpen, open, onOpenChange: setIsOpen, dragY, dragHandlers },
    confirm: {
      isOpen: isConfirming,
      ask,
      cancel: () => setIsConfirming(false),
      accept: form.onSubmit,
    },
    // Midday rather than midnight: the key is a plain date, and a date
    // parsed as UTC midnight is the previous day in any zone behind it,
    // which would print the month before.
    monthLabel: month ? monthName(format, month) : "",
    pioneerStart,
    form,
  };
};
