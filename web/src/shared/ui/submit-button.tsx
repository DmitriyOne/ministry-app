"use client";

import type { ReactNode } from "react";

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
  className?: string;
};

export const SubmitButton = ({
  children,
  isPending,
  isBlocked = false,
  className,
}: SubmitButtonProps) => (
  <Button
    type="submit"
    variant="action"
    size="role-lg"
    isDisabled={isBlocked || isPending}
    className={className}
  >
    {isPending ? <Spinner className="size-5" /> : null}
    {children}
  </Button>
);
