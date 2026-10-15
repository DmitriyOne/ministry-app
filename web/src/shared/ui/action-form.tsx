"use client";

import type { FormEvent, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

// The <form> element every form in this project uses, written once.
//
// `noValidate` is not a detail: without it the browser's own bubble fires
// first and the field-level errors this project renders (ADR 0013) never
// appear. The preventDefault + call shape is the other half — a form that
// submits natively would navigate away from a Server Action flow.
//
// Three widgets had this exact element copied, which is three chances for
// one of them to lose `noValidate` in an edit and start behaving unlike
// the others for reasons nobody would look for.
type ActionFormProps = {
  onSubmit: () => void;
  children: ReactNode;
  className?: string;
};

export const ActionForm = ({ onSubmit, children, className }: ActionFormProps) => (
  <form
    noValidate
    className={cn("flex flex-col gap-3.5", className)}
    onSubmit={(event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    {children}
  </form>
);
