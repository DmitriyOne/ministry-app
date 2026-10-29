"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/dialog";
import { showToast } from "@/shared/ui/sonner";

import type { CloseMonthStatus } from "../model/close-month-status";
import { closeMonth, reopenMonth } from "../api/close-month-action";

type CloseMonthButtonProps = {
  month: string;
  state: "closable" | "closed";
  // The copy. Passed in, like the sign-out button's: the screen owns the
  // words, this feature owns the scenario.
  labels: {
    close: string;
    reopen: string;
    confirmTitle: string;
    confirmBody: string;
    confirmHoursLabel: string;
    hours: string;
    cancel: string;
    failed: string;
    refused: string;
  };
};

// Closing asks first; reopening does not.
//
// The asymmetry is the point rather than an oversight: closing takes
// something away — the month stops being editable — while reopening only
// gives it back, and a dialog in front of an undo is a toll on the way
// out. Enter does not confirm the dialog either, which is a decision of
// its own (ADR 0013): react-aria keeps the focus on the quiet button,
// and the owner would rather the way out were the easy one.
//
// The action is called from a handler rather than through a <form
// action={...}>, because there is nothing to submit: the month is in the
// address, and what comes back decides whether anything is said.
export const CloseMonthButton = ({ month, state, labels }: CloseMonthButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // The action revalidates this address, but the answer still has to be
  // brought back into the open page: refresh is what re-runs the read
  // and redraws the notice.
  const settle = (status: CloseMonthStatus) => {
    if (status === "success") {
      router.refresh();

      return;
    }

    // signedOut lands here as well: the next navigation runs into the
    // proxy and ends at /login, and saying "please sign in" on a screen
    // about to be replaced helps nobody — what the person sees is that
    // nothing happened, and the sentence says so.
    showToast({
      message: status === "refused" ? labels.refused : labels.failed,
      tone: "negative",
    });
  };

  const run = (action: typeof closeMonth) => {
    startTransition(async () => {
      setIsOpen(false);
      settle((await action({ month })).status);
    });
  };

  if (state === "closed") {
    return (
      <Button
        variant="plain"
        size="role-lg"
        className="w-full"
        isDisabled={isPending}
        onPress={() => run(reopenMonth)}
      >
        {isPending ? <Spinner className="size-5" /> : null}
        {labels.reopen}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="action"
        size="role-lg"
        className="w-full"
        isDisabled={isPending}
        onPress={() => setIsOpen(true)}
      >
        {labels.close}
      </Button>

      <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle>{labels.confirmTitle}</DialogTitle>
        <DialogDescription>{labels.confirmBody}</DialogDescription>

        {/* What is being fixed, in the one figure it is about. The
            owner's design has it in the dialog, and it belongs there:
            the question is "is this right", and the answer is a
            number. */}
        <div className="flex items-baseline justify-between gap-3 rounded-xl bg-card px-4 py-3">
          <span className="text-caption font-540 text-ink-muted">
            {labels.confirmHoursLabel}
          </span>
          <span className="text-list-row font-620 text-ink tabular-nums">{labels.hours}</span>
        </div>

        <DialogFooter>
          {/* Cancelling is the quiet option and the one a stray tap
              should land on, so it sits away from the thumb. */}
          <Button variant="plain" size="role" onPress={() => setIsOpen(false)}>
            {labels.cancel}
          </Button>
          {/* An ordinary Button with a spinner rather than
              SubmitButton: there is nothing to submit — the month is in
              the address (ADR 0013). */}
          <Button
            variant="action"
            size="role"
            isDisabled={isPending}
            onPress={() => run(closeMonth)}
          >
            {isPending ? <Spinner className="size-5" /> : null}
            {labels.close}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};
