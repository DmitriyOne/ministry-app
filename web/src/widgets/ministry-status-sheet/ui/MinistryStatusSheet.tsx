"use client";

import { useTranslations } from "next-intl";

import type { EffectiveMinistryStatus } from "@/entities/ministry-status";
import {
  ConfirmMinistryStatusDialog,
  MinistryStatusForm,
  useSetMinistryStatus,
} from "@/features/set-ministry-status";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { ListRow } from "@/shared/ui/list-row";
import { Sheet, SheetDragHandle, sheetDragStyle } from "@/shared/ui/sheet";

type MinistryStatusSheetProps = {
  // What the person is on this month, exactly as the screen read it.
  // Null when the read failed: the row then says so instead of naming a
  // status nobody confirmed.
  status: EffectiveMinistryStatus | null;
  // Whether the appointment already covers the start of the service
  // year, so the sub-question opens on the answer in force rather than
  // on one that would retract September on the next Save.
  pioneeringSinceYearStart: boolean;
};

// Widget: the row on the profile and the panel it opens. Everything the
// panel is FOR belongs to features/set-ministry-status — the choices and
// the save button (MinistryStatusForm), the confirmation
// (ConfirmMinistryStatusDialog) and all of the state (useSetMinistryStatus)
// — exactly the way the install panel is split between this layer and
// features/install-carousel. What is left here is where things sit.
//
// There is no offline check of its own, and that is deliberate.
// NetworkGate already replaces the whole app with the offline screen when
// the origin cannot be reached (ADR 0055), so this panel cannot be on
// screen at that point; a write that slips through the few seconds before
// the probe notices comes back as "unavailable" and raises a toast; and a
// backend that is down while the origin answers is only ever visible that
// second way.
export const MinistryStatusSheet = ({
  status,
  pioneeringSinceYearStart,
}: MinistryStatusSheetProps) => {
  const t = useTranslations("screens.profile.ministrySheet");
  const statusName = useTranslations("screens.profile.ministryStatus");

  const { sheet, confirm, monthLabel, pioneerStart, form } = useSetMinistryStatus({ status, pioneeringSinceYearStart });

  return (
    <>
      {/* A native button, not a react-aria one: the tap target is a whole
          list row, and Button's variants are sized for a screen's actions
          (ADR 0013 allows a plain element where no react-aria primitive
          is involved). */}
      <button type="button" onClick={sheet.open} aria-haspopup="dialog" className="w-full text-left">
        <ListRow
          divided={false}
          title={t("row.title")}
          text={status ? statusName(status.status) : t("row.unknown")}
          trailing={(
            <span className="flex shrink-0 items-center gap-2.5">
              <span className="text-body font-540 text-ink-muted">{t("row.action")}</span>
              <ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />
            </span>
          )}
        />
      </button>

      <Sheet
        side="bottom"
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        showCloseButton={false}
        className="mx-auto max-w-md gap-3 rounded-t-3xl px-5 pt-0 pb-5"
        style={sheetDragStyle(sheet.dragY)}
      >
        {/* The same bar, the same threshold and the same feel as the
            install panel: both come from shared/ui/sheet. A close button
            on top of it would be a second way out of a panel that already
            closes by swipe, by backdrop and by Save. */}
        <SheetDragHandle {...sheet.dragHandlers} className="-mx-5" />

        <MinistryStatusForm
          form={form}
          monthLabel={monthLabel}
          pioneerStart={pioneerStart}
          onSave={confirm.ask}
        />
      </Sheet>

      <ConfirmMinistryStatusDialog
        isOpen={confirm.isOpen}
        monthLabel={monthLabel}
        isPending={form.isPending}
        onCancel={confirm.cancel}
        onConfirm={confirm.accept}
      />
    </>
  );
};
