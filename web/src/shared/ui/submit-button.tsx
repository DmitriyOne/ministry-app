"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

// The submit button of a form, with the project's two rules built in.
//
// First rule (CLAUDE.md, ADR 0013): the button is disabled while the form
// holds an error. Before the first submit there are no errors and the
// button is live; after it, it stays disabled until they are fixed.
// Second: a request in flight shows a spinner AND disables the button —
// `react-aria`'s isDisabled, not the DOM `disabled` attribute.
//
// Both used to be spelled out in each form, together with the spinner's
// size, so "the button looks different on one screen" was a change away.
type SubmitButtonProps = {
  children: ReactNode;
  isPending: boolean;
  // Anything else that should block the submit — in practice
  // `hasErrors` from useActionForm.
  isBlocked?: boolean;
  // Every form in the project submits with the same green action button,
  // which is why those are the defaults. The confirming button of the
  // sign-out dialog is the exception that made these props necessary: it
  // is the alert tone, and it sits in a dialog footer rather than at the
  // foot of a screen. Passing them beats a second component that would
  // drift from this one's two rules.
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
};

export const SubmitButton = ({
  children,
  isPending,
  isBlocked = false,
  variant = "action",
  size = "role-lg",
  className,
}: SubmitButtonProps) => (
  <Button
    type="submit"
    variant={variant}
    size={size}
    isDisabled={isBlocked || isPending}
    className={className}
  >
    {isPending ? <Spinner className="size-5" /> : null}
    {children}
  </Button>
);
