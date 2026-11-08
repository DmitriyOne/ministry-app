"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { SubmitButton } from "@/shared/ui/submit-button";

import { signOut } from "../api/sign-out-action";

type SignOutButtonProps = {
  label: string;
  // The copy for the confirmation. Passed in, like `label`: the screen owns
  // the words, this feature owns the scenario.
  confirm: { title: string; body: string; confirm: string; cancel: string };
};

// Asking before signing out, because getting back in costs an email and a
// password — there is no "undo" and nobody can reset their own (ADR 0043:
// the owner issues the accounts).
//
// This is why the component is now a client one. It used to be a plain
// <form action={signOut}> with no "use client" at all, which meant signing
// out worked before — and without — JavaScript. That property is gone, and
// it is a real loss: on the one screen where someone might be trying to get
// out of a session gone wrong, the way out now needs JS to run. Accepted
// because the rest of the app needs JS regardless — LaunchGate decides
// whether the app may render at all (ADR 0019) — so a session that can be
// signed out of is a session that was usable in the first place.
//
// The confirming button stays a submit inside its own <form>, so the Server
// Action is invoked the ordinary way, with its redirect and its cache
// invalidation, rather than through a handler.
// The confirming button, as its own component for one reason:
// `useFormStatus` reports the status of the form it is rendered INSIDE,
// so it cannot be called in the component that renders the <form>.
//
// Without it the button sat there saying nothing while the action ran,
// and it runs for a while: signing out revokes the session with the auth
// server over the network, then invalidates the client cache, then
// redirects to /login. The owner reported exactly that — "no loading on
// the button and it waits a long time". The wait is real work and is not
// shortened here; what changes is that the button now admits to it.
const ConfirmSignOut = ({ label }: { label: string }) => {
  const { pending } = useFormStatus();

  return (
    <SubmitButton isPending={pending} variant="alert" size="role" className="w-full">
      {label}
    </SubmitButton>
  );
};

export const SignOutButton = ({ label, confirm }: SignOutButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="plain"
        size="role-lg"
        className="w-full text-negative"
        onPress={() => setIsOpen(true)}
      >
        {label}
      </Button>

      <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader>
          <DialogTitle>{confirm.title}</DialogTitle>
          <DialogDescription>{confirm.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {/* Staying is the quiet option and the one a stray tap should
              land on, so it sits on the left, away from the thumb. */}
          <Button variant="plain" size="role" onPress={() => setIsOpen(false)}>
            {confirm.cancel}
          </Button>
          <form action={signOut}>
            <ConfirmSignOut label={confirm.confirm} />
          </form>
        </DialogFooter>
      </Dialog>
    </>
  );
};
