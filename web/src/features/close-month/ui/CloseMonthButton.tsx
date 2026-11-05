"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
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
    reopenConfirmTitle: string;
    reopenConfirmBody: string;
    reopenConfirm: string;
    cancel: string;
    failed: string;
    refused: string;
  };
};

// Both answers are asked for.
//
// Closing was asked from the start; reopening was not, and the asymmetry
// was argued for — closing takes something away, reopening only gives it
// back, and a dialog in front of an undo is a toll on the way out. The
// owner overruled it (2026-11-02): a month that reopens on one stray tap
// is a month nobody can trust to stay shut, and the tap is right under
// the thumb on a screen people scroll. ADR 0066, decision 6 says so.
//
// Enter does not confirm either dialog, which is a decision of its own
// (ADR 0013): react-aria keeps the focus on the quiet button, and the
// owner would rather the way out were the easy one.
//
// The action is called from a handler rather than through a <form
// action={...}>, because there is nothing to submit: the month is in the
// address, and what comes back decides whether anything is said.
export const CloseMonthButton = ({ month, state, labels }: CloseMonthButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isClosed = state === "closed";

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

  const run = () => {
    startTransition(async () => {
      setIsOpen(false);
      settle((await (isClosed ? reopenMonth : closeMonth)({ month })).status);
    });
  };

  return (
    <>
      <Button
        variant={isClosed ? "plain" : "action"}
        size="role-lg"
        className="w-full"
        isDisabled={isPending}
        onPress={() => setIsOpen(true)}
      >
        {isPending ? <Spinner className="size-5" /> : null}
        {isClosed ? labels.reopen : labels.close}
      </Button>

      <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader>
          <DialogTitle>{isClosed ? labels.reopenConfirmTitle : labels.confirmTitle}</DialogTitle>
          <DialogDescription>
            {isClosed ? labels.reopenConfirmBody : labels.confirmBody}
          </DialogDescription>
        </DialogHeader>

        {/* What is being fixed, in the one figure it is about. The
            owner's design has it in the dialog, and it belongs there:
            the question is "is this right", and the answer is a number.
            Reopening shows nothing — it fixes no figure, and a number
            under that question would only invite the wrong reading. */}
        {isClosed
          ? null
          : (
              <div className="flex items-baseline justify-between gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-card">
                <span className="text-list-row text-ink-muted">{labels.confirmHoursLabel}</span>
                <span className="text-list-row font-620 text-ink tabular-nums">
                  {labels.hours}
                </span>
              </div>
            )}

        <DialogFooter>
          {/* Cancelling is the quiet option and the one a stray tap
              should land on, so it sits away from the thumb. */}
          <Button variant="plain" size="role" onPress={() => setIsOpen(false)}>
            {labels.cancel}
          </Button>
          {/* An ordinary Button with a spinner rather than
              SubmitButton: there is nothing to submit — the month is in
              the address (ADR 0013). */}
          <Button variant="action" size="role" isDisabled={isPending} onPress={run}>
            {isPending ? <Spinner className="size-5" /> : null}
            {isClosed ? labels.reopenConfirm : labels.close}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};
