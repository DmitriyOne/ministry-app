"use client";

import { useState } from "react";

import { type SheetDragHandlers, useSheetDrag } from "@/shared/ui/sheet";

type UseExportSheetResult = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  onOpenChange: (isOpen: boolean) => void;
  dragY: number;
  dragHandlers: SheetDragHandlers;
};

// Whether the format panel is open — this slice's only piece of state.
//
// The same shape as useInstallSheet, and the swipe gesture comes from the
// same place (shared/ui/sheet): one implementation, one threshold, one
// feel across all three panels in the app.
//
// `close` is here on top of `onOpenChange` because something other than
// the panel closes it: picking a format starts a download and the panel
// has no reason to stay up.
export const useExportSheet = (): UseExportSheetResult => {
  const [isOpen, setIsOpen] = useState(false);
  const { dragY, dragHandlers } = useSheetDrag({ onClose: () => setIsOpen(false) });

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    onOpenChange: setIsOpen,
    dragY,
    dragHandlers,
  };
};
