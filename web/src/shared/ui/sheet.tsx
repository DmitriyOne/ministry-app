"use client";

import type { CSSProperties, ComponentProps, PointerEvent as ReactPointerEvent, PointerEventHandler, ReactNode } from "react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/cn";
import {
  Heading,
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
  Dialog as SheetPrimitive,
  DialogTrigger as SheetTriggerPrimitive,
  type ModalOverlayProps as ModalOverlayPrimitiveProps,
  type DialogTriggerProps as SheetTriggerPrimitiveProps,
} from "react-aria-components";

import { Button } from "@/shared/ui/button";
import { CloseIcon } from "@/shared/ui/icons";

export const SheetTrigger = ({ ...props }: SheetTriggerPrimitiveProps) => (
  <SheetTriggerPrimitive data-slot="sheet-trigger" {...props} />
);

export const SheetClose = ({
  className,
  variant = "outline",
  size = "default",
  ...props
}: ComponentProps<typeof Button>) => (
  <Button
    slot="close"
    data-slot="sheet-close"
    variant={variant}
    size={size}
    className={cn(className)}
    {...props}
  />
);

const SheetOverlay = ({
  className,
  children,
  ...props
}: Omit<ModalOverlayPrimitiveProps, "className" | "children"> & {
  className?: string;
  children: ReactNode;
}) => (
  <ModalOverlayPrimitive
    data-slot="sheet-overlay"
    isDismissable
    className={cn(
      "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-entering:opacity-0 data-exiting:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
      className,
    )}
    {...props}
  >
    {children}
  </ModalOverlayPrimitive>
);

type SheetProps = Omit<ModalOverlayPrimitiveProps, "className" | "children">
  & Pick<ComponentProps<typeof ModalPrimitive>, "isDismissable"> & {
    className?: string;
    children: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    showCloseButton?: boolean;
    // Swiping the panel (e.g. swipe-to-close bottom-to-top) needs direct
    // access to the positioned panel element, not the overlay —
    // react-aria-components has no built-in gesture, the caller layers
    // one on top through these props.
    style?: CSSProperties;
    onPointerDown?: PointerEventHandler<HTMLDivElement>;
    onPointerMove?: PointerEventHandler<HTMLDivElement>;
    onPointerUp?: PointerEventHandler<HTMLDivElement>;
    onPointerCancel?: PointerEventHandler<HTMLDivElement>;
  };

export const Sheet = ({
  className,
  children,
  side = "right",
  showCloseButton = true,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...props
}: SheetProps) => {
  const t = useTranslations("a11y.sheet");

  return (
    <SheetOverlay {...props}>
      <ModalPrimitive
        data-slot="sheet-content"
        data-side={side}
        style={style}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-entering:opacity-0 data-exiting:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:max-h-sheet data-[side=bottom]:border-t data-[side=bottom]:data-entering:translate-y-[2.5rem] data-[side=bottom]:data-exiting:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-entering:translate-x-[-2.5rem] data-[side=left]:data-exiting:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-entering:translate-x-[2.5rem] data-[side=right]:data-exiting:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-entering:translate-y-[-2.5rem] data-[side=top]:data-exiting:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className,
        )}
      >
        <SheetPrimitive
          data-slot="sheet"
          // min-h-0: without it a flex child refuses to shrink below its
          // content, and the body a caller marks as scrollable never
          // becomes one — the panel grows past the cap instead.
          className="[display:inherit] h-full max-h-[inherit] min-h-0 [flex-direction:inherit] [gap:inherit] outline-none"
        >
          {children}
          {showCloseButton
            ? (
                <SheetClose variant="ghost" className="absolute top-3 right-3" size="icon-sm">
                  <CloseIcon />
                  <span className="sr-only">{t("close")}</span>
                </SheetClose>
              )
            : null}
        </SheetPrimitive>
      </ModalPrimitive>
    </SheetOverlay>
  );
};

export const SheetContent = ({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: ComponentProps<typeof Sheet>) => (
  <Sheet className={className} side={side} showCloseButton={showCloseButton} {...props}>
    {children}
  </Sheet>
);

export const SheetHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sheet-header"
    className={cn("flex flex-col gap-0.5 p-4", className)}
    {...props}
  />
);

export const SheetFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sheet-footer"
    className={cn("mt-auto flex shrink-0 flex-col gap-2 p-4", className)}
    {...props}
  />
);

export const SheetTitle = ({
  className,
  ...props
}: Omit<ComponentProps<typeof Heading>, "slot">) => (
  <Heading
    slot="title"
    data-slot="sheet-title"
    className={cn("font-heading text-base font-medium text-foreground", className)}
    {...props}
  />
);

export const SheetDescription = ({
  className,
  ...props
}: Omit<ComponentProps<"div">, "slot">) => (
  <div data-slot="sheet-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
);

// ---------------------------------------------------------------------
// Swipe down to close
// ---------------------------------------------------------------------
// react-aria-components ships no such gesture, so it is added by hand —
// and it lives HERE, with the panel, rather than in the one feature that
// happened to need it first. It was written for the install panel (ADR
// 0018); the ministry status sheet needed exactly the same thing, and
// the choice was between a second copy and this move. The hook keeps the
// numbers and the handle keeps the look, so two panels cannot drift
// apart in either.

// A downward swipe past this threshold (px) closes the panel — from the
// design ("swipe down, ~90px threshold").
const CLOSE_DRAG_THRESHOLD = 90;

export type SheetDragHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
};

type UseSheetDragResult = {
  // How far the panel is currently dragged, in px, never negative:
  // the caller feeds it to the panel's transform.
  dragY: number;
  dragHandlers: SheetDragHandlers;
};

export const useSheetDrag = ({ onClose }: { onClose: () => void }): UseSheetDragResult => {
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
    if (dragY > CLOSE_DRAG_THRESHOLD) onClose();
    setDragY(0);
  };

  return {
    dragY,
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
};

// The grab area at the top of a bottom sheet: the bar people aim at, and
// the only element the gesture is attached to — dragging the panel's body
// would fight with scrolling inside it.
export const SheetDragHandle = ({ className, ...handlers }: SheetDragHandlers & { className?: string }) => (
  <div
    data-slot="sheet-drag-handle"
    className={cn(
      "flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing",
      className,
    )}
    {...handlers}
  >
    <div aria-hidden="true" className="h-1 w-9 rounded-full bg-ink/15" />
  </div>
);

// The transform a dragged panel wears. Kept beside the hook so a caller
// cannot invent its own easing and make one panel feel unlike the other.
export const sheetDragStyle = (dragY: number): CSSProperties | undefined =>
  dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined;
