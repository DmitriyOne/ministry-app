"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/dialog";
import { Spinner } from "@/shared/ui/spinner";

type ConfirmMinistryStatusDialogProps = {
  isOpen: boolean;
  // The month the new status starts in, already in the person's words.
  // Formatted by the hook, so this dialog and the sheet behind it cannot
  // name different months.
  appliesFromLabel: string;
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
  appliesFromLabel,
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
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogDescription>{t("body", { date: appliesFromLabel })}</DialogDescription>
      <DialogFooter>
        {/* Keeping things as they are is the quiet option and the one a
            stray tap should land on, so it sits away from the thumb —
            the same order as the sign-out dialog. */}
        <Button variant="plain" size="role" onPress={onCancel}>
          {t("cancel")}
        </Button>
        {/* Not SubmitButton: there is no <form> here. The choice lives in
            the sheet behind this dialog and is sent programmatically, so
            the two rules SubmitButton carries — a spinner while in
            flight, disabled while in flight — are spelled out instead. */}
        <Button variant="action" size="role" isDisabled={isPending} onPress={onConfirm}>
          {isPending ? <Spinner className="size-5" /> : null}
          {t("confirm")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
