"use client";

import { useTranslations } from "next-intl";

import { InstallCarousel } from "@/features/install-carousel";
import { useInstallSheet } from "@/features/install-sheet";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetClose, SheetFooter } from "@/shared/ui/sheet";

// Widget: the panel's own layout (trigger, drag handle, carousel, "OK"
// button) and wiring up react-aria Sheet. The drag gesture lives in
// features/install-sheet (useInstallSheet), the instruction steps in
// features/install-carousel.
export const InstallSheet = () => {
  const t = useTranslations("screens.installApp");
  const { isOpen, open, onOpenChange, dragY, dragHandlers } = useInstallSheet();

  return (
    <>
      <Button variant="deep" size="role" onPress={open}>
        {t("installButton")}
      </Button>

      <Sheet
        side="bottom"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showCloseButton={false}
        className="mx-auto max-w-md gap-1 rounded-t-3xl pt-0"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragY > 0 ? "none" : undefined,
        }}
      >
        <div
          data-slot="sheet-drag-handle"
          className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing"
          onPointerDown={dragHandlers.onPointerDown}
          onPointerMove={dragHandlers.onPointerMove}
          onPointerUp={dragHandlers.onPointerUp}
          onPointerCancel={dragHandlers.onPointerCancel}
        >
          <div aria-hidden="true" className="h-1 w-9 rounded-full bg-ink/15" />
        </div>

        <InstallCarousel />

        <SheetFooter className="pt-0 pb-2">
          <SheetClose variant="deep" size="role" className="w-full">
            {t("sheet.okButton")}
          </SheetClose>
        </SheetFooter>
      </Sheet>
    </>
  );
};
