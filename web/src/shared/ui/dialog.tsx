"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  Dialog as DialogPrimitive,
  Heading,
  Modal as ModalPrimitive,
  ModalOverlay as ModalOverlayPrimitive,
  type ModalOverlayProps,
} from "react-aria-components";

import { cn } from "@/shared/lib/cn";
import { SheetDragHandle, sheetDragStyle, useSheetDrag } from "@/shared/ui/sheet";

// Vendored from the shadcn registry (@shadcn/dialog, aria-nova), no new npm
// dependencies — it is built on react-aria-components, which this project
// already uses (ADR 0012/0013), and react-aria is what makes it a real
// dialog: focus moves in and is trapped, Escape and a tap outside close it,
// the rest of the page is inert, and the heading is announced. None of that
// is worth reimplementing.
//
// Adapted the way every vendored file is: arrow functions, our `cn`, no
// dark variants (ADR 0011), no rings (ADR 0013), project tokens instead of
// the registry's `text-sm`/`ring-foreground/10`. Two things dropped
// outright: the registry's IconPlaceholder close button (a registry-only
// component, and a confirmation dialog should be answered by its own two
// buttons, not dismissed by a cross) and DialogHeader, which was a div with
// one class. react-aria's DialogTrigger is not re-exported either: the one
// caller drives the dialog from state, and an export nothing imports is
// how a component library starts drifting from what it is actually for
// (ADR 0012).
type DialogProps = Omit<ModalOverlayProps, "className" | "children"> & {
  className?: string;
  children: ReactNode;
};

export const Dialog = ({
  className,
  children,
  isDismissable = true,
  onOpenChange,
  ...props
}: DialogProps) => {
  // The same swipe the install and status panels answer to, and from the
  // same place: a bottom sheet that cannot be swiped down is the one
  // gesture a phone tries first. The handle is drawn only because it
  // works — a bar that invites a drag and does nothing is the defect ADR
  // 0012 records.
  const { dragY, dragHandlers } = useSheetDrag({ onClose: () => onOpenChange?.(false) });

  return (
    <ModalOverlayPrimitive
      data-slot="dialog-overlay"
      isDismissable={isDismissable}
      onOpenChange={onOpenChange}
      // The scrim is --ink at 40%, not black: the palette has no black, and
      // the warm ink reads as the same material as the rest of the app. There
      // is no token for a scrim, and one colour used once does not need one.
      className="fixed inset-0 isolate z-50 flex items-end justify-center bg-ink/40 p-3 pb-[calc(--spacing(3)+env(safe-area-inset-bottom))] duration-150 supports-backdrop-filter:backdrop-blur-sm data-entering:animate-in data-entering:fade-in-0 data-exiting:animate-out data-exiting:fade-out-0"
      {...props}
    >
      <ModalPrimitive
        data-slot="dialog-content"
        style={sheetDragStyle(dragY)}
        // Bottom sheet, not a centred box: this is a phone-only app, the
        // thumb is at the bottom, and the install panel already answers
        // "the app is asking something" in this shape (ADR 0018).
        //
        // The panel is --background, not --card, and that is the whole
        // reason it was rebuilt (owner, 2026-11-02): a white panel makes
        // every white card inside it disappear, and the close-month
        // dialog was showing its figure on an invisible one. The warm
        // ground is also what the rest of the app stands on, so a card
        // laid on it reads as a card.
        //
        // Capped at the same height a panel is, and for the same reason
        // (ADR 0012, update 2026-11-02): this is a bottom sheet now, it
        // is `h-auto`, and nothing stopped it growing past the top of
        // the screen — where the overlay is `items-end` and does not
        // scroll, so what grew out became unreachable rather than
        // clipped. Never measured on a device; the cap costs nothing
        // while the content fits, which is every dialog the app has
        // today, and the tallest of them (closing a month, with its
        // figure) is new in this release.
        className={cn(
          "flex max-h-sheet w-full max-w-100 flex-col rounded-4xl bg-background px-5 pb-5 text-ink shadow-mark-elevated outline-none duration-150 data-entering:animate-in data-entering:slide-in-from-bottom-4 data-exiting:animate-out data-exiting:slide-out-to-bottom-4",
          className,
        )}
      >
        <DialogPrimitive data-slot="dialog" className="flex min-h-0 flex-1 flex-col gap-5 outline-none">
          <SheetDragHandle className="-mt-1 -mb-2" {...dragHandlers} />
          {/* The handle stays put and the rest scrolls, as in a panel —
              with one honest difference: a dialog's footer is part of
              what the caller passes, so it travels with the content
              instead of sitting below the scroll. Two buttons that have
              to be scrolled to are still better than two buttons under
              a title nobody can see. */}
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </DialogPrimitive>
      </ModalPrimitive>
    </ModalOverlayPrimitive>
  );
};

// Title and description as one block, because they are read as one
// sentence and the gap between them is not the gap between them and the
// rest. Dropped from the vendored file as "a div with one class"; it
// earns its place now that the title is a heading and the line under it
// carries the month (owner's design, 2026-11-02).
export const DialogHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="dialog-header"
    className={cn("flex flex-col gap-1.5", className)}
    {...props}
  />
);

export const DialogTitle = ({
  className,
  ...props
}: Omit<ComponentProps<typeof Heading>, "slot">) => (
  <Heading
    slot="title"
    data-slot="dialog-title"
    className={cn("text-day-title font-640 tracking-day-title text-ink", className)}
    {...props}
  />
);

export const DialogDescription = ({ className, ...props }: ComponentProps<"p">) => (
  <p
    data-slot="dialog-description"
    className={cn("text-body text-ink-muted", className)}
    {...props}
  />
);

// Buttons side by side, the answer on the right where the thumb is. The
// caller supplies the buttons: which of them is destructive, and what it
// says, is not this component's business (the shared/ui boundary, ADR 0013).
export const DialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="dialog-footer"
    className={cn("flex gap-2.5 *:flex-1", className)}
    {...props}
  />
);
