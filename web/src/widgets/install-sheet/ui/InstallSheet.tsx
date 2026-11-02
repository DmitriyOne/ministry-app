"use client";

import { useTranslations } from "next-intl";

import { InstallCarousel } from "@/features/install-carousel";
import { useInstallSheet } from "@/features/install-sheet";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetClose, SheetDragHandle, SheetFooter, sheetDragStyle } from "@/shared/ui/sheet";

// Widget: the panel's own layout (trigger, handle, carousel, "OK"
// button) and wiring up react-aria Sheet. Whether the panel is open is
// features/install-sheet's; the swipe-to-close gesture it hands back
// comes from shared/ui/sheet, which both panels in the app now share;
// the instruction steps are features/install-carousel's.
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
        style={sheetDragStyle(dragY)}
      >
        <SheetDragHandle {...dragHandlers} />

        {/* Scrollable for the same reason as the status panel's body, and
            because the panel is now capped: content taller than the cap
            would otherwise be clipped rather than reachable. The footer
            below keeps its mt-auto and stays put. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <InstallCarousel />
        </div>

        <SheetFooter className="pt-0 pb-2">
          <SheetClose variant="deep" size="role" className="w-full">
            {t("sheet.okButton")}
          </SheetClose>
        </SheetFooter>
      </Sheet>
    </>
  );
};
