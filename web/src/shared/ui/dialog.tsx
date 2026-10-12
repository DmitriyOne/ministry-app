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

export const Dialog = ({ className, children, isDismissable = true, ...props }: DialogProps) => (
  <ModalOverlayPrimitive
    data-slot="dialog-overlay"
    isDismissable={isDismissable}
    // The scrim is --ink at 40%, not black: the palette has no black, and
    // the warm ink reads as the same material as the rest of the app. There
    // is no token for a scrim, and one colour used once does not need one.
    className="fixed inset-0 isolate z-50 flex items-end justify-center bg-ink/40 p-5 pb-[calc(--spacing(5)+env(safe-area-inset-bottom))] duration-150 supports-backdrop-filter:backdrop-blur-sm data-entering:animate-in data-entering:fade-in-0 data-exiting:animate-out data-exiting:fade-out-0"
    {...props}
  >
    <ModalPrimitive
      data-slot="dialog-content"
      // Bottom sheet, not a centred box: this is a phone-only app, the
      // thumb is at the bottom, and the install panel already answers
      // "the app is asking something" in this shape (ADR 0018).
      className={cn(
        "w-full max-w-100 rounded-2xl bg-card p-5 text-ink shadow-mark-elevated outline-none duration-150 data-entering:animate-in data-entering:slide-in-from-bottom-4 data-exiting:animate-out data-exiting:slide-out-to-bottom-4",
        className,
      )}
    >
      <DialogPrimitive data-slot="dialog" className="flex flex-col gap-4 outline-none">
        {children}
      </DialogPrimitive>
    </ModalPrimitive>
  </ModalOverlayPrimitive>
);

export const DialogTitle = ({
  className,
  ...props
}: Omit<ComponentProps<typeof Heading>, "slot">) => (
  <Heading
    slot="title"
    data-slot="dialog-title"
    className={cn("text-list-row font-620 text-ink", className)}
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
