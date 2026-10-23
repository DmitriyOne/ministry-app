"use client";

import { useState } from "react";

import { type SheetDragHandlers, useSheetDrag } from "@/shared/ui/sheet";

type UseInstallSheetResult = {
  isOpen: boolean;
  open: () => void;
  onOpenChange: (isOpen: boolean) => void;
  dragY: number;
  dragHandlers: SheetDragHandlers;
};

// Opening and closing the install panel. The swipe-down gesture used to
// be written out here, and moved into shared/ui/sheet.tsx when a second
// panel needed it (the ministry status sheet): one implementation, one
// threshold, one feel. What stays is this slice's own business — whether
// the panel is open.
//
// The shape of the result is unchanged, so widgets/install-sheet did not
// have to move with it.
export const useInstallSheet = (): UseInstallSheetResult => {
  const [isOpen, setIsOpen] = useState(false);
  const { dragY, dragHandlers } = useSheetDrag({ onClose: () => setIsOpen(false) });

  return {
    isOpen,
    open: () => setIsOpen(true),
    onOpenChange: setIsOpen,
    dragY,
    dragHandlers,
  };
};
