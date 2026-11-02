"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Spinner } from "@/shared/ui/spinner";

type ConfirmMinistryStatusDialogProps = {
  isOpen: boolean;
  // The month the new status applies to, already in the person's words.
  // Formatted by the hook, so this dialog and the sheet behind it cannot
  // name different months.
  monthLabel: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Asked on every change, because it moves the goal the hours on the day
// screen are measured against — and the hours themselves are not touched,
// which is the half people worry about, so the dialog says it.
//
// Part of the feature rather than the widget: what is confirmed, and in
// which words, belongs to the scenario; the widget only places it.
export const ConfirmMinistryStatusDialog = ({
  isOpen,
  monthLabel,
  isPending,
  onCancel,
  onConfirm,
}: ConfirmMinistryStatusDialogProps) => {
  const t = useTranslations("screens.profile.ministrySheet.confirm");

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        // Closing by Escape or by the backdrop means the same as
        // pressing "keep as it is".
        if (!open) onCancel();
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("body", { month: monthLabel })}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        {/* Keeping things as they are is the quiet option and the one a
            stray tap should land on, so it sits away from the thumb —
            the same order as the sign-out dialog. */}
        <Button variant="plain" size="role" onPress={onCancel}>
          {t("cancel")}
        </Button>
        {/* A plain button, not SubmitButton in a form of its own: there
            is nothing here to submit. The values live in the sheet
            behind this dialog, in react-hook-form, and the Server Action
            is called through its hook — so a <form> around this button
            would be an empty shell, and the two rules SubmitButton
            carries (spinner in flight, blocked in flight) are spelled
            out instead.

            Which means the dialog does not answer to Enter, and that is
            the owner's decision (2026-10-23): making it would mean
            moving focus onto the confirming button, and the way out of a
            dialog should keep it. The dialog is answered by tapping, the
            same as the sign-out one. */}
        <Button variant="action" size="role" isDisabled={isPending} onPress={onConfirm}>
          {isPending ? <Spinner className="size-5" /> : null}
          {t("confirm")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
