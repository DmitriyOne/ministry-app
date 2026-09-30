"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";

// A downward swipe past this threshold (px) closes the panel — from the
// design ("swipe down, ~90px threshold").
const CLOSE_DRAG_THRESHOLD = 90;

export type InstallSheetDragHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
};

type UseInstallSheetResult = {
  isOpen: boolean;
  open: () => void;
  onOpenChange: (isOpen: boolean) => void;
  dragY: number;
  dragHandlers: InstallSheetDragHandlers;
};

// react-aria-components doesn't ship a "drag down to close" gesture —
// added on top by hand (drag handlers on the handle at the top of the
// panel; widgets/install-sheet renders them on its own drag handle). The
// panel itself (focus trap, closing on backdrop/Esc/the "OK" button)
// comes from react-aria (shared/ui/sheet.tsx).
export const useInstallSheet = (): UseInstallSheetResult => {
  const [isOpen, setIsOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    setDragY(Math.max(0, event.clientY - dragStartY.current));
  };

  const endDrag = () => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    if (dragY > CLOSE_DRAG_THRESHOLD) setIsOpen(false);
    setDragY(0);
  };

  return {
    isOpen,
    open: () => setIsOpen(true),
    onOpenChange: setIsOpen,
    dragY,
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
};
